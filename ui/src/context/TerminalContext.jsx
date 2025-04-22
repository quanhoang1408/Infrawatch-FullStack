import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { initiateSSHConnection } from '../services/terminal.service';
import { TERMINAL_THEMES, TERMINAL_DEFAULT_OPTIONS } from '../constants/terminal.constants';

// Tạo context cho Terminal SSH
export const TerminalContext = createContext();

/**
 * TerminalProvider cung cấp quản lý và điều khiển các phiên terminal SSH
 */
export const TerminalProvider = ({ children }) => {
  // State lưu trữ các instance của terminal
  const [terminals, setTerminals] = useState({});
  // State lưu trữ các kết nối đang hoạt động
  const [activeConnections, setActiveConnections] = useState({});
  // State theo dõi terminal đang được chọn
  const [activeTerminalId, setActiveTerminalId] = useState(null);
  // State lưu trữ lịch sử lệnh
  const [commandHistory, setCommandHistory] = useState({});
  // State lưu trữ cài đặt terminal
  const [terminalSettings, setTerminalSettings] = useState({
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: TERMINAL_THEMES.DARK,
    cursorBlink: true,
    scrollback: 1000
  });

  // Sử dụng ref để lưu trữ thông tin WebSocket connections
  const wsConnections = useRef({});
  // Sử dụng ref để lưu trữ các xterm addons
  const terminalAddons = useRef({});

  /**
   * Tạo một terminal mới và thiết lập kết nối SSH
   * @param {string} vmId ID của máy ảo cần kết nối
   * @param {Object} options Tùy chọn cho terminal
   * @returns {string} ID của terminal vừa tạo
   */
  const createTerminal = useCallback(async (vmId, options = {}) => {
    try {
      // Generate ID cho terminal mới
      const terminalId = `term-${Date.now()}`;

      // Khởi tạo terminal addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      // Lưu trữ addons để sử dụng sau này
      terminalAddons.current[terminalId] = {
        fitAddon,
        webLinksAddon,
        searchAddon
      };

      // Khởi tạo terminal với các tùy chọn mặc định kết hợp với tùy chọn được truyền vào
      const terminal = new XTerm({
        ...TERMINAL_DEFAULT_OPTIONS,
        ...terminalSettings,
        ...options
      });

      // Đăng ký các addons
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      // Thêm terminal mới vào state
      setTerminals(prev => ({
        ...prev,
        [terminalId]: terminal
      }));

      // Khởi tạo lịch sử lệnh cho terminal này
      setCommandHistory(prev => ({
        ...prev,
        [terminalId]: []
      }));

      // Thiết lập kết nối SSH với máy ảo
      const connectionInfo = await initiateSSHConnection(vmId, 'ubuntu');

      // Lưu thông tin kết nối
      setActiveConnections(prev => ({
        ...prev,
        [terminalId]: {
          vmId,
          status: 'connecting',
          info: connectionInfo
        }
      }));

      // Đặt terminal này làm active
      setActiveTerminalId(terminalId);

      return terminalId;
    } catch (error) {
      console.error('Error creating terminal:', error);
      throw error;
    }
  }, [terminalSettings]);

  /**
   * Thiết lập kết nối WebSocket cho terminal
   * @param {string} terminalId ID của terminal
   * @param {HTMLElement} container Phần tử DOM để gắn terminal
   */
  const setupTerminalConnection = useCallback((terminalId, container) => {
    const terminal = terminals[terminalId];
    const connection = activeConnections[terminalId];

    if (!terminal || !connection) {
      console.error(`Terminal ${terminalId} or connection not found`);
      return;
    }

    try {
      // Gắn terminal vào container
      terminal.open(container);

      // Resize terminal để vừa với container
      terminalAddons.current[terminalId].fitAddon.fit();

      // Tạo WebSocket connection
      const ws = new WebSocket(connection.info.websocketUrl);

      // Lưu kết nối WebSocket
      wsConnections.current[terminalId] = ws;

      // Xử lý khi WebSocket mở
      ws.onopen = () => {
        // Cập nhật trạng thái kết nối
        setActiveConnections(prev => ({
          ...prev,
          [terminalId]: {
            ...prev[terminalId],
            status: 'connected'
          }
        }));

        // Terminal nhận input từ người dùng và gửi đến server
        terminal.onData(data => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input', data }));
          }
        });
      };

      // Xử lý khi nhận dữ liệu từ server
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'output') {
            // Hiển thị output từ server lên terminal
            terminal.write(message.data);
          } else if (message.type === 'error') {
            // Hiển thị lỗi
            terminal.write(`\r\n\x1b[31m${message.data}\x1b[0m\r\n`);
          } else if (message.type === 'command') {
            // Lưu lệnh vào lịch sử
            const command = message.data.trim();
            if (command) {
              setCommandHistory(prev => ({
                ...prev,
                [terminalId]: [...new Set([...prev[terminalId], command])]
              }));
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
          terminal.write(`\r\n\x1b[31mError processing message: ${error.message}\x1b[0m\r\n`);
        }
      };

      // Xử lý khi WebSocket đóng
      ws.onclose = () => {
        terminal.write('\r\n\x1b[33mConnection closed\x1b[0m\r\n');

        // Cập nhật trạng thái kết nối
        setActiveConnections(prev => ({
          ...prev,
          [terminalId]: {
            ...prev[terminalId],
            status: 'disconnected'
          }
        }));
      };

      // Xử lý lỗi WebSocket
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        terminal.write(`\r\n\x1b[31mConnection error: ${error.message}\x1b[0m\r\n`);

        // Cập nhật trạng thái kết nối
        setActiveConnections(prev => ({
          ...prev,
          [terminalId]: {
            ...prev[terminalId],
            status: 'error'
          }
        }));
      };

      // Resize terminal khi cửa sổ thay đổi kích thước
      const handleResize = () => {
        if (terminalAddons.current[terminalId]) {
          terminalAddons.current[terminalId].fitAddon.fit();

          // Gửi thông tin kích thước mới đến server
          if (ws.readyState === WebSocket.OPEN) {
            const { cols, rows } = terminal;
            ws.send(JSON.stringify({
              type: 'resize',
              data: { cols, rows }
            }));
          }
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error(`Error setting up terminal ${terminalId}:`, error);
      throw error;
    }
  }, [terminals, activeConnections]);

  /**
   * Đóng một terminal
   * @param {string} terminalId ID của terminal cần đóng
   */
  const closeTerminal = useCallback((terminalId) => {
    try {
      // Đóng WebSocket connection
      if (wsConnections.current[terminalId]) {
        wsConnections.current[terminalId].close();
        delete wsConnections.current[terminalId];
      }

      // Dispose terminal
      if (terminals[terminalId]) {
        terminals[terminalId].dispose();
      }

      // Xóa terminal khỏi state
      setTerminals(prev => {
        const newTerminals = { ...prev };
        delete newTerminals[terminalId];
        return newTerminals;
      });

      // Xóa thông tin kết nối
      setActiveConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[terminalId];
        return newConnections;
      });

      // Xóa addons
      delete terminalAddons.current[terminalId];

      // Nếu đóng terminal đang active, chuyển sang terminal khác (nếu có)
      if (activeTerminalId === terminalId) {
        const remainingTerminalIds = Object.keys(terminals).filter(id => id !== terminalId);
        setActiveTerminalId(remainingTerminalIds.length > 0 ? remainingTerminalIds[0] : null);
      }
    } catch (error) {
      console.error(`Error closing terminal ${terminalId}:`, error);
    }
  }, [terminals, activeTerminalId]);

  /**
   * Gửi command đến terminal
   * @param {string} terminalId ID của terminal
   * @param {string} command Command cần gửi
   */
  const sendCommand = useCallback((terminalId, command) => {
    try {
      const ws = wsConnections.current[terminalId];

      if (ws && ws.readyState === WebSocket.OPEN) {
        // Thêm newline vào cuối command nếu chưa có
        const commandWithNewline = command.endsWith('\n') ? command : `${command}\n`;

        // Gửi command đến server
        ws.send(JSON.stringify({
          type: 'input',
          data: commandWithNewline
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error sending command to terminal ${terminalId}:`, error);
      return false;
    }
  }, []);

  /**
   * Cập nhật cài đặt cho terminal
   * @param {Object} newSettings Cài đặt mới
   */
  const updateTerminalSettings = useCallback((newSettings) => {
    setTerminalSettings(prev => ({
      ...prev,
      ...newSettings
    }));

    // Áp dụng cài đặt mới cho tất cả terminals đang mở
    Object.keys(terminals).forEach(terminalId => {
      const terminal = terminals[terminalId];

      // Cập nhật các thuộc tính được hỗ trợ
      if (newSettings.fontSize) {
        terminal.options.fontSize = newSettings.fontSize;
      }

      if (newSettings.fontFamily) {
        terminal.options.fontFamily = newSettings.fontFamily;
      }

      if (newSettings.theme) {
        terminal.options.theme = newSettings.theme;
      }

      if (newSettings.cursorBlink !== undefined) {
        terminal.options.cursorBlink = newSettings.cursorBlink;
      }

      // Resize terminal để áp dụng thay đổi
      if (terminalAddons.current[terminalId]) {
        terminalAddons.current[terminalId].fitAddon.fit();
      }
    });
  }, [terminals]);

  /**
   * Tìm kiếm trong terminal
   * @param {string} terminalId ID của terminal
   * @param {string} searchText Text cần tìm
   * @param {Object} options Tùy chọn tìm kiếm (caseSensitive, wholeWord, regex)
   */
  const searchInTerminal = useCallback((terminalId, searchText, options = {}) => {
    if (terminalAddons.current[terminalId] && terminalAddons.current[terminalId].searchAddon) {
      const searchAddon = terminalAddons.current[terminalId].searchAddon;

      // Tìm kiếm với các tùy chọn
      return searchAddon.findNext(searchText, {
        caseSensitive: options.caseSensitive || false,
        wholeWord: options.wholeWord || false,
        regex: options.regex || false
      });
    }

    return false;
  }, []);

  // Xóa tất cả terminals khi component unmount
  useEffect(() => {
    return () => {
      // Đóng tất cả WebSocket connections
      Object.keys(wsConnections.current).forEach(terminalId => {
        if (wsConnections.current[terminalId]) {
          wsConnections.current[terminalId].close();
        }
      });

      // Dispose tất cả terminals
      Object.values(terminals).forEach(terminal => {
        terminal.dispose();
      });
    };
  }, [terminals]);

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    terminals,
    activeConnections,
    activeTerminalId,
    commandHistory,
    terminalSettings,
    createTerminal,
    setupTerminalConnection,
    closeTerminal,
    sendCommand,
    updateTerminalSettings,
    searchInTerminal,
    setActiveTerminalId,
    terminalThemes: TERMINAL_THEMES
  };

  return (
    <TerminalContext.Provider value={contextValue}>
      {children}
    </TerminalContext.Provider>
  );
};

export default TerminalContext;