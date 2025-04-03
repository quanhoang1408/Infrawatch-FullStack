import { useContext, useEffect, useState, useRef } from 'react';
import { TerminalContext } from '../context';
import { terminalService } from '../services';
import { useNotification } from './useNotification';

/**
 * Hook để quản lý terminal SSH trong ứng dụng
 * 
 * @returns {Object} Các phương thức và trạng thái liên quan đến terminal
 */
export const useTerminal = () => {
  const context = useContext(TerminalContext);
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const commandHistoryRef = useRef([]);
  const commandIndexRef = useRef(-1);

  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }

  const { 
    activeTerminals, 
    setActiveTerminals, 
    terminalSettings, 
    setTerminalSettings 
  } = context;

  /**
   * Thiết lập terminal với các tùy chọn
   * 
   * @param {Object} terminal - Đối tượng Terminal từ xterm.js
   * @param {HTMLElement} container - Container để gắn terminal
   */
  const setupTerminal = (terminal, container) => {
    if (!terminal || !container) return;

    // Lưu tham chiếu đến terminal
    terminalRef.current = terminal;

    // Áp dụng cài đặt từ context
    applyTerminalSettings(terminal, terminalSettings);

    // Gắn terminal vào container
    terminal.open(container);
    terminal.focus();

    // Xử lý sự kiện input
    terminal.onData(data => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });
  };

  /**
   * Áp dụng cài đặt terminal
   * 
   * @param {Object} terminal - Đối tượng Terminal từ xterm.js
   * @param {Object} settings - Cài đặt terminal
   */
  const applyTerminalSettings = (terminal, settings) => {
    if (!terminal) return;

    const { 
      fontSize, 
      fontFamily, 
      theme, 
      cursorBlink, 
      cursorStyle, 
      scrollback 
    } = settings;

    terminal.options.fontSize = fontSize;
    terminal.options.fontFamily = fontFamily;
    terminal.options.theme = theme;
    terminal.options.cursorBlink = cursorBlink;
    terminal.options.cursorStyle = cursorStyle;
    terminal.options.scrollback = scrollback;

    // Cập nhật lại terminal nếu đã được mở
    if (terminal.element) {
      terminal.refresh();
    }
  };

  /**
   * Kết nối đến máy ảo qua SSH
   * 
   * @param {string} vmId - ID của máy ảo để kết nối
   * @param {Object} terminal - Đối tượng Terminal từ xterm.js
   * @returns {Promise<WebSocket>} Kết nối WebSocket đã được thiết lập
   */
  const connectToVM = async (vmId, terminal) => {
    if (!vmId || !terminal) {
      throw new Error('Missing vmId or terminal instance');
    }

    setLoading(true);
    setConnectionError(null);

    try {
      // Lấy token kết nối WebSocket từ server
      const connectionToken = await terminalService.getTerminalToken(vmId);
      
      // Tạo địa chỉ WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/terminal/connect/${connectionToken}`;

      // Đóng kết nối cũ nếu có
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Thiết lập kết nối WebSocket mới
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setLoading(false);
        
        // Thêm terminal mới vào danh sách active terminals
        const newTerminal = {
          id: Date.now().toString(),
          vmId,
          name: `Terminal - ${vmId}`,
          timestamp: new Date(),
          active: true
        };
        
        setActiveTerminals(prev => {
          // Đặt tất cả terminal khác là không active
          const updated = prev.map(t => ({
            ...t,
            active: false
          }));
          
          return [...updated, newTerminal];
        });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'output':
              terminal.write(message.data);
              // Lưu lệnh vào lịch sử nếu là lệnh hoàn chỉnh
              if (message.isCommand && message.command) {
                addToCommandHistory(message.command);
              }
              break;
              
            case 'error':
              terminal.write(`\r\n\x1b[31m${message.data}\x1b[0m\r\n`);
              break;
              
            case 'resize':
              // Cập nhật kích thước terminal nếu cần
              terminal.resize(message.cols, message.rows);
              break;
              
            case 'disconnect':
              terminal.write('\r\n\x1b[33mConnection closed by server\x1b[0m\r\n');
              setConnected(false);
              break;
              
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
          terminal.write(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Lỗi kết nối WebSocket');
        setConnected(false);
        terminal.write('\r\n\x1b[31mWebSocket connection error\x1b[0m\r\n');
      };

      socket.onclose = () => {
        setConnected(false);
        terminal.write('\r\n\x1b[33mConnection closed\x1b[0m\r\n');
      };

      return socket;
    } catch (err) {
      setConnectionError(err.message || 'Không thể kết nối đến máy ảo');
      setLoading(false);
      setConnected(false);
      terminal.write(`\r\n\x1b[31mConnection error: ${err.message}\x1b[0m\r\n`);
      showError('Lỗi kết nối', err.message || 'Không thể kết nối đến máy ảo');
      throw err;
    }
  };

  /**
   * Thay đổi kích thước terminal
   * 
   * @param {number} cols - Số cột
   * @param {number} rows - Số hàng
   */
  const resizeTerminal = (cols, rows) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));

      // Cập nhật kích thước terminal giao diện
      if (terminalRef.current) {
        terminalRef.current.resize(cols, rows);
      }
    }
  };

  /**
   * Đóng kết nối terminal
   */
  const closeConnection = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnected(false);
  };

  /**
   * Gửi lệnh tới terminal
   * 
   * @param {string} command - Lệnh cần gửi
   */
  const sendCommand = (command) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalRef.current) {
      // Gửi lệnh tới server
      socketRef.current.send(JSON.stringify({
        type: 'input',
        data: command + '\r'
      }));
      
      // Lưu lệnh vào lịch sử
      addToCommandHistory(command);
    }
  };

  /**
   * Thêm lệnh vào lịch sử
   * 
   * @param {string} command - Lệnh cần thêm vào lịch sử
   */
  const addToCommandHistory = (command) => {
    // Kiểm tra lệnh có ý nghĩa không
    if (command && command.trim()) {
      // Kiểm tra xem lệnh đã tồn tại trong lịch sử chưa
      const exists = commandHistoryRef.current.includes(command);
      
      if (!exists) {
        // Thêm lệnh mới vào đầu lịch sử
        commandHistoryRef.current = [
          command,
          ...commandHistoryRef.current.slice(0, 99) // Giới hạn 100 lệnh
        ];
      } else {
        // Nếu lệnh đã tồn tại, đưa lên đầu
        commandHistoryRef.current = [
          command,
          ...commandHistoryRef.current.filter(cmd => cmd !== command)
        ];
      }
      
      // Reset chỉ số lịch sử
      commandIndexRef.current = -1;
    }
  };

  /**
   * Lấy lệnh trước đó trong lịch sử
   * 
   * @returns {string|null} Lệnh trước đó hoặc null nếu không có
   */
  const getPreviousCommand = () => {
    if (commandHistoryRef.current.length === 0) return null;
    
    const nextIndex = Math.min(
      commandIndexRef.current + 1, 
      commandHistoryRef.current.length - 1
    );
    
    commandIndexRef.current = nextIndex;
    return commandHistoryRef.current[nextIndex];
  };

  /**
   * Lấy lệnh tiếp theo trong lịch sử
   * 
   * @returns {string|null} Lệnh tiếp theo hoặc null nếu không có
   */
  const getNextCommand = () => {
    if (commandHistoryRef.current.length === 0 || commandIndexRef.current <= 0) {
      commandIndexRef.current = -1;
      return '';
    }
    
    const nextIndex = commandIndexRef.current - 1;
    commandIndexRef.current = nextIndex;
    
    if (nextIndex === -1) return '';
    return commandHistoryRef.current[nextIndex];
  };

  /**
   * Lấy danh sách lịch sử lệnh
   * 
   * @returns {Array<string>} Danh sách lệnh
   */
  const getCommandHistory = () => {
    return [...commandHistoryRef.current];
  };

  /**
   * Xóa lịch sử lệnh
   */
  const clearCommandHistory = () => {
    commandHistoryRef.current = [];
    commandIndexRef.current = -1;
  };

  /**
   * Cập nhật cài đặt terminal
   * 
   * @param {Object} newSettings - Cài đặt mới cần áp dụng
   */
  const updateTerminalSettings = (newSettings) => {
    const updatedSettings = {
      ...terminalSettings,
      ...newSettings
    };
    
    setTerminalSettings(updatedSettings);
    
    // Áp dụng cài đặt mới cho terminal hiện tại
    if (terminalRef.current) {
      applyTerminalSettings(terminalRef.current, updatedSettings);
    }
  };

  /**
   * Chuyển đổi giữa các terminal đang hoạt động
   * 
   * @param {string} terminalId - ID của terminal cần chuyển tới
   */
  const switchTerminal = (terminalId) => {
    // Cập nhật trạng thái active cho tất cả terminals
    setActiveTerminals(prev => 
      prev.map(terminal => ({
        ...terminal,
        active: terminal.id === terminalId
      }))
    );
  };

  /**
   * Đóng một terminal cụ thể
   * 
   * @param {string} terminalId - ID của terminal cần đóng
   */
  const closeTerminal = (terminalId) => {
    // Tìm terminal trong danh sách
    const terminalToClose = activeTerminals.find(t => t.id === terminalId);
    
    // Xóa terminal khỏi danh sách
    setActiveTerminals(prev => prev.filter(t => t.id !== terminalId));
    
    // Nếu đang đóng terminal active, cần chuyển sang terminal khác
    if (terminalToClose && terminalToClose.active) {
      const remainingTerminals = activeTerminals.filter(t => t.id !== terminalId);
      if (remainingTerminals.length > 0) {
        // Kích hoạt terminal đầu tiên còn lại
        const nextTerminalId = remainingTerminals[0].id;
        switchTerminal(nextTerminalId);
      }
    }
  };

  // Dọn dẹp kết nối khi component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connected,
    loading,
    connectionError,
    activeTerminals,
    terminalSettings,
    setupTerminal,
    connectToVM,
    closeConnection,
    resizeTerminal,
    sendCommand,
    getPreviousCommand,
    getNextCommand,
    getCommandHistory,
    clearCommandHistory,
    updateTerminalSettings,
    switchTerminal,
    closeTerminal
  };
};