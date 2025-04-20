import { rest } from 'msw';
import { 
  mockUsers, 
  mockVMs, 
  mockActivities, 
  mockDashboardStats, 
  mockCertificates,
  generateMetricsData,
  generateVMLogs,
  generateTerminalOutput,
  mockTerminalSessions
} from './data';

// Helper function to simulate API delay
const delayResponse = (min = 300, max = 800) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a fake JWT token
const generateToken = (username) => {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IiR7dXNlcm5hbWV9IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
};

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { username, password } = req.body;
    
    // Simple auth check
    if ((username === 'admin' && password === 'admin') || 
        (username === 'user' && password === 'user')) {
      const user = mockUsers.find(u => u.username === username);
      
      return res(
        ctx.delay(delayResponse()),
        ctx.status(200),
        ctx.json({
          token: generateToken(username),
          user
        })
      );
    }
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(401),
      ctx.json({
        message: 'Thông tin đăng nhập không chính xác'
      })
    );
  }),
  
  rest.post('/api/auth/register', (req, res, ctx) => {
    const userData = req.body;
    
    // Check if username or email already exists
    if (mockUsers.some(u => u.username === userData.username)) {
      return res(
        ctx.delay(delayResponse()),
        ctx.status(400),
        ctx.json({
          message: 'Tên đăng nhập đã tồn tại'
        })
      );
    }
    
    if (mockUsers.some(u => u.email === userData.email)) {
      return res(
        ctx.delay(delayResponse()),
        ctx.status(400),
        ctx.json({
          message: 'Email đã tồn tại'
        })
      );
    }
    
    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      avatar: null
    };
    
    mockUsers.push(newUser);
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(201),
      ctx.json({
        message: 'Đăng ký thành công',
        user: newUser
      })
    );
  }),
  
  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.delay(delayResponse(200, 500)),
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),
  
  rest.get('/api/auth/me', (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'Không có token xác thực' })
      );
    }
    
    return res(
      ctx.delay(delayResponse(200, 500)),
      ctx.status(200),
      ctx.json(mockUsers[0]) // Return admin user
    );
  }),
  
  // VM endpoints
  rest.get('/api/vm', (req, res, ctx) => {
    // Get query parameters
    const status = req.url.searchParams.get('status');
    const provider = req.url.searchParams.get('provider');
    const search = req.url.searchParams.get('search');
    
    // Filter VMs
    let filteredVMs = [...mockVMs];
    
    if (status) {
      filteredVMs = filteredVMs.filter(vm => vm.status === status);
    }
    
    if (provider) {
      filteredVMs = filteredVMs.filter(vm => vm.provider === provider);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVMs = filteredVMs.filter(vm => 
        vm.name.toLowerCase().includes(searchLower) ||
        vm.ip.includes(search) ||
        vm.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(filteredVMs)
    );
  }),
  
  rest.get('/api/vm/:id', (req, res, ctx) => {
    const { id } = req.params;
    const vm = mockVMs.find(vm => vm.id === id);
    
    if (!vm) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(vm)
    );
  }),
  
  rest.post('/api/vms/:id/start', (req, res, ctx) => {
    const { id } = req.params;
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    
    if (vmIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Update VM status
    mockVMs[vmIndex].status = 'running';
    mockVMs[vmIndex].cpu = Math.floor(Math.random() * 40) + 10;
    mockVMs[vmIndex].ram = Math.floor(Math.random() * 30) + 30;
    mockVMs[vmIndex].network = Math.floor(Math.random() * 20) + 5;
    
    // Add activity
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'vm_start',
      vmId: id,
      vmName: mockVMs[vmIndex].name,
      user: 'admin',
      message: `${mockVMs[vmIndex].name} đã được khởi động`
    });
    
    return res(
      ctx.delay(delayResponse(1000, 3000)),
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: 'Máy ảo đã được khởi động'
      })
    );
  }),
  
  rest.post('/api/vms/:id/stop', (req, res, ctx) => {
    const { id } = req.params;
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    
    if (vmIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Update VM status
    mockVMs[vmIndex].status = 'stopped';
    mockVMs[vmIndex].cpu = 0;
    mockVMs[vmIndex].ram = 0;
    mockVMs[vmIndex].network = 0;
    
    // Add activity
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'vm_stop',
      vmId: id,
      vmName: mockVMs[vmIndex].name,
      user: 'admin',
      message: `${mockVMs[vmIndex].name} đã được tắt`
    });
    
    return res(
      ctx.delay(delayResponse(1000, 3000)),
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: 'Máy ảo đã được tắt'
      })
    );
  }),
  
  rest.post('/api/vms/:id/restart', (req, res, ctx) => {
    const { id } = req.params;
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    
    if (vmIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Update VM status
    mockVMs[vmIndex].status = 'running';
    mockVMs[vmIndex].cpu = Math.floor(Math.random() * 40) + 10;
    mockVMs[vmIndex].ram = Math.floor(Math.random() * 30) + 30;
    mockVMs[vmIndex].network = Math.floor(Math.random() * 20) + 5;
    
    // Add activity
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'vm_restart',
      vmId: id,
      vmName: mockVMs[vmIndex].name,
      user: 'admin',
      message: `${mockVMs[vmIndex].name} đã được khởi động lại`
    });
    
    return res(
      ctx.delay(delayResponse(2000, 5000)),
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: 'Máy ảo đã được khởi động lại'
      })
    );
  }),
  
  rest.delete('/api/vms/:id', (req, res, ctx) => {
    const { id } = req.params;
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    
    if (vmIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Add activity
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'vm_delete',
      vmId: id,
      vmName: mockVMs[vmIndex].name,
      user: 'admin',
      message: `${mockVMs[vmIndex].name} đã được xóa`
    });
    
    // Remove VM from list
    mockVMs.splice(vmIndex, 1);
    
    return res(
      ctx.delay(delayResponse(800, 2000)),
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: 'Máy ảo đã được xóa'
      })
    );
  }),
  
  // VM metrics endpoint
  rest.get('/api/vms/:id/metrics', (req, res, ctx) => {
    const { id } = req.params;
    const vm = mockVMs.find(vm => vm.id === id);
    
    if (!vm) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Get time range from query params
    const timeRange = req.url.searchParams.get('timeRange') || '1h';
    let hours = 1;
    
    switch (timeRange) {
      case '6h':
        hours = 6;
        break;
      case '24h':
        hours = 24;
        break;
      case '7d':
        hours = 24 * 7;
        break;
      default:
        hours = 1;
    }
    
    // Generate metrics data
    const metrics = {
      cpu: generateMetricsData(hours, 5, vm.cpu, 15),
      ram: generateMetricsData(hours, 5, vm.ram, 10),
      disk: generateMetricsData(hours, 5, vm.disk, 5),
      network: generateMetricsData(hours, 5, vm.network, 20)
    };
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(metrics)
    );
  }),
  
  // VM logs endpoint
  rest.get('/api/vms/:id/logs', (req, res, ctx) => {
    const { id } = req.params;
    const vm = mockVMs.find(vm => vm.id === id);
    
    if (!vm) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Get limit and page from query params
    const limit = parseInt(req.url.searchParams.get('limit') || '100');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    
    // Generate logs
    const logs = generateVMLogs(id, 100);
    
    // Paginate logs
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json({
        logs: paginatedLogs,
        pagination: {
          total: logs.length,
          page,
          limit,
          totalPages: Math.ceil(logs.length / limit)
        }
      })
    );
  }),
  
  // Dashboard statistics endpoint
  rest.get('/api/dashboard/stats', (req, res, ctx) => {
    // Calculate real-time values from mockVMs
    const stats = {
      ...mockDashboardStats,
      overview: {
        ...mockDashboardStats.overview,
        totalVMs: mockVMs.length,
        runningVMs: mockVMs.filter(vm => vm.status === 'running').length,
        stoppedVMs: mockVMs.filter(vm => vm.status === 'stopped').length,
        avgCPU: Math.round(mockVMs.filter(vm => vm.status === 'running').reduce((sum, vm) => sum + vm.cpu, 0) / 
          Math.max(1, mockVMs.filter(vm => vm.status === 'running').length)),
        providers: {
          AWS: mockVMs.filter(vm => vm.provider === 'AWS').length,
          Azure: mockVMs.filter(vm => vm.provider === 'Azure').length,
          GCP: mockVMs.filter(vm => vm.provider === 'GCP').length,
          VMware: mockVMs.filter(vm => vm.provider === 'VMware').length
        }
      },
      activities: mockActivities.slice(0, 5)
    };
    
    return res(
      ctx.delay(delayResponse(700, 1500)),
      ctx.status(200),
      ctx.json(stats)
    );
  }),
  
  // Activities endpoint
  rest.get('/api/activities', (req, res, ctx) => {
    // Get limit and page from query params
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const type = req.url.searchParams.get('type');
    const vmId = req.url.searchParams.get('vmId');
    
    // Filter activities
    let filteredActivities = [...mockActivities];
    
    if (type) {
      filteredActivities = filteredActivities.filter(activity => activity.type === type);
    }
    
    if (vmId) {
      filteredActivities = filteredActivities.filter(activity => activity.vmId === vmId);
    }
    
    // Paginate activities
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json({
        activities: paginatedActivities,
        pagination: {
          total: filteredActivities.length,
          page,
          limit,
          totalPages: Math.ceil(filteredActivities.length / limit)
        }
      })
    );
  }),
  
  // Certificate endpoints
  rest.get('/api/certificates', (req, res, ctx) => {
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(mockCertificates)
    );
  }),
  
  rest.get('/api/certificates/:id', (req, res, ctx) => {
    const { id } = req.params;
    const certificate = mockCertificates.find(cert => cert.id === id);
    
    if (!certificate) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy certificate' })
      );
    }
    
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(certificate)
    );
  }),
  
  rest.post('/api/certificates', (req, res, ctx) => {
    const certData = req.body;
    
    // Create new certificate
    const newCertificate = {
      id: `cert-${mockCertificates.length + 1}`,
      ...certData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year from now
      status: 'active',
      vms: certData.vms || []
    };
    
    mockCertificates.push(newCertificate);
    
    return res(
      ctx.delay(delayResponse(1000, 2000)),
      ctx.status(201),
      ctx.json(newCertificate)
    );
  }),
  
  // Terminal session endpoints
  rest.post('/api/terminal/sessions', (req, res, ctx) => {
    const { vmId } = req.body;
    const vm = mockVMs.find(vm => vm.id === vmId);
    
    if (!vm) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy máy ảo' })
      );
    }
    
    // Check if VM is running
    if (vm.status !== 'running') {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Máy ảo không trong trạng thái chạy' })
      );
    }
    
    // Create new session
    const sessionId = `session-${Date.now()}`;
    const session = {
      id: sessionId,
      vmId,
      status: 'active',
      created: new Date().toISOString(),
      user: 'admin'
    };
    
    // Add to mock sessions
    mockTerminalSessions.push(session);
    
    // Add activity
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'ssh_access',
      vmId,
      vmName: vm.name,
      user: 'admin',
      message: `Truy cập SSH vào ${vm.name}`
    });
    
    return res(
      ctx.delay(delayResponse(1000, 3000)),
      ctx.status(201),
      ctx.json({
        session,
        welcome: `Connected to ${vm.name} (${vm.ip})\n${vm.operatingSystem}\nLast login: ${new Date().toLocaleString()}\n\n`
      })
    );
  }),
  
  rest.post('/api/terminal/sessions/:sessionId/execute', (req, res, ctx) => {
    const { sessionId } = req.params;
    const { command } = req.body;
    const session = mockTerminalSessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy phiên terminal' })
      );
    }
    
    // Generate output for command
    const output = generateTerminalOutput(command);
    
    return res(
      ctx.delay(delayResponse(300, 800)),
      ctx.status(200),
      ctx.json({
        output,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  rest.get('/api/terminal/sessions/:sessionId/output', (req, res, ctx) => {
    const { sessionId } = req.params;
    const session = mockTerminalSessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy phiên terminal' })
      );
    }
    
    return res(
      ctx.delay(delayResponse(200, 500)),
      ctx.status(200),
      ctx.json({
        output: '',
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  rest.post('/api/terminal/sessions/:sessionId/resize', (req, res, ctx) => {
    const { sessionId } = req.params;
    const { cols, rows } = req.body;
    const session = mockTerminalSessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy phiên terminal' })
      );
    }
    
    return res(
      ctx.delay(delayResponse(100, 300)),
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Terminal resized'
      })
    );
  }),
  
  rest.delete('/api/terminal/sessions/:sessionId', (req, res, ctx) => {
    const { sessionId } = req.params;
    const sessionIndex = mockTerminalSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Không tìm thấy phiên terminal' })
      );
    }
    
    // Update session status
    mockTerminalSessions[sessionIndex].status = 'closed';
    mockTerminalSessions[sessionIndex].closed = new Date().toISOString();
    
    return res(
      ctx.delay(delayResponse(300, 800)),
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Terminal session closed'
      })
    );
  }),
  
  rest.get('/api/terminal/sessions', (req, res, ctx) => {
    return res(
      ctx.delay(delayResponse()),
      ctx.status(200),
      ctx.json(mockTerminalSessions)
    );
  })
];
