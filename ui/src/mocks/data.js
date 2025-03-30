// Mock data for development

// Users
export const mockUsers = [
    {
      id: 1,
      username: 'admin',
      name: 'Quản trị viên',
      email: 'admin@example.com',
      role: 'admin',
      avatar: null
    },
    {
      id: 2,
      username: 'user',
      name: 'Người dùng',
      email: 'user@example.com',
      role: 'user',
      avatar: null
    }
  ];
  
  // VMs
  export const mockVMs = [
    {
      id: 'vm-1',
      name: 'web-server-01',
      status: 'running',
      provider: 'AWS',
      region: 'ap-southeast-1',
      type: 't2.medium',
      ip: '192.168.1.10',
      cpu: 23,
      ram: 45,
      disk: 35,
      network: 10,
      created: '2023-03-15T10:30:00Z',
      description: 'Web server running Nginx',
      operatingSystem: 'Ubuntu 20.04',
      tags: ['production', 'web']
    },
    {
      id: 'vm-2',
      name: 'db-server',
      status: 'running',
      provider: 'Azure',
      region: 'southeastasia',
      type: 'Standard_D2s_v3',
      ip: '192.168.1.20',
      cpu: 67,
      ram: 72,
      disk: 50,
      network: 25,
      created: '2023-02-20T08:45:00Z',
      description: 'Database server running MySQL',
      operatingSystem: 'CentOS 8',
      tags: ['production', 'database']
    },
    {
      id: 'vm-3',
      name: 'backup-server',
      status: 'stopped',
      provider: 'GCP',
      region: 'asia-southeast1',
      type: 'e2-medium',
      ip: '192.168.1.30',
      cpu: 0,
      ram: 0,
      disk: 25,
      network: 0,
      created: '2023-01-10T14:20:00Z',
      description: 'Backup server',
      operatingSystem: 'Debian 11',
      tags: ['utility', 'backup']
    },
    {
      id: 'vm-4',
      name: 'api-server',
      status: 'running',
      provider: 'VMware',
      region: 'on-premise',
      type: '2vCPU-4GB',
      ip: '192.168.1.40',
      cpu: 38,
      ram: 52,
      disk: 45,
      network: 18,
      created: '2023-04-05T11:15:00Z',
      description: 'API server running Node.js',
      operatingSystem: 'Ubuntu 22.04',
      tags: ['production', 'api']
    },
    {
      id: 'vm-5',
      name: 'cache-server',
      status: 'running',
      provider: 'AWS',
      region: 'ap-southeast-1',
      type: 't2.small',
      ip: '192.168.1.50',
      cpu: 15,
      ram: 60,
      disk: 20,
      network: 35,
      created: '2023-03-25T09:10:00Z',
      description: 'Cache server running Redis',
      operatingSystem: 'Amazon Linux 2',
      tags: ['production', 'cache']
    },
    {
      id: 'vm-6',
      name: 'test-server',
      status: 'stopped',
      provider: 'GCP',
      region: 'asia-southeast1',
      type: 'e2-small',
      ip: '192.168.1.60',
      cpu: 0,
      ram: 0,
      disk: 15,
      network: 0,
      created: '2023-02-15T16:40:00Z',
      description: 'Test environment',
      operatingSystem: 'Ubuntu 20.04',
      tags: ['development', 'test']
    },
    {
      id: 'vm-7',
      name: 'dev-server',
      status: 'running',
      provider: 'Azure',
      region: 'southeastasia',
      type: 'Standard_B1s',
      ip: '192.168.1.70',
      cpu: 42,
      ram: 38,
      disk: 30,
      network: 12,
      created: '2023-04-12T13:25:00Z',
      description: 'Development environment',
      operatingSystem: 'Ubuntu 22.04',
      tags: ['development', 'staging']
    },
    {
      id: 'vm-8',
      name: 'monitoring-server',
      status: 'running',
      provider: 'VMware',
      region: 'on-premise',
      type: '4vCPU-8GB',
      ip: '192.168.1.80',
      cpu: 85,
      ram: 75,
      disk: 65,
      network: 45,
      created: '2023-03-10T12:50:00Z',
      description: 'Monitoring server running Prometheus and Grafana',
      operatingSystem: 'CentOS 7',
      tags: ['utility', 'monitoring']
    }
  ];
  
  // Activities
  export const mockActivities = [
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      type: 'vm_start',
      vmId: 'vm-1',
      vmName: 'web-server-01',
      user: 'admin',
      message: 'web-server-01 đã được khởi động'
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 minutes ago
      type: 'vm_stop',
      vmId: 'vm-3',
      vmName: 'backup-server',
      user: 'admin',
      message: 'backup-server đã được tắt'
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1 hour 15 minutes ago
      type: 'ssh_access',
      vmId: 'vm-2',
      vmName: 'db-server',
      user: 'admin',
      message: 'Truy cập SSH vào db-server'
    },
    {
      id: 'act-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2 hours 30 minutes ago
      type: 'vm_restart',
      vmId: 'vm-5',
      vmName: 'cache-server',
      user: 'admin',
      message: 'cache-server đã được khởi động lại'
    },
    {
      id: 'act-5',
      timestamp: new Date(Date.now() - 1000 * 60 * 195).toISOString(), // 3 hours 15 minutes ago
      type: 'ssh_key_update',
      vmId: 'vm-7',
      vmName: 'dev-server',
      user: 'admin',
      message: 'SSH certificate đã được cập nhật cho dev-server'
    },
    {
      id: 'act-6',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
      type: 'vm_create',
      vmId: 'vm-8',
      vmName: 'monitoring-server',
      user: 'admin',
      message: 'monitoring-server đã được tạo'
    }
  ];
  
  // Certificates
  export const mockCertificates = [
    {
      id: 'cert-1',
      name: 'Production Access',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335).toISOString(), // 335 days from now
      status: 'active',
      vms: ['vm-1', 'vm-2', 'vm-4', 'vm-5'],
      user: 'admin'
    },
    {
      id: 'cert-2',
      name: 'Development Access',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 350).toISOString(), // 350 days from now
      status: 'active',
      vms: ['vm-6', 'vm-7'],
      user: 'user'
    },
    {
      id: 'cert-3',
      name: 'Backup Access',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 320).toISOString(), // 320 days from now
      status: 'active',
      vms: ['vm-3'],
      user: 'admin'
    },
    {
      id: 'cert-4',
      name: 'Monitoring Access',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 355).toISOString(), // 355 days from now
      status: 'active',
      vms: ['vm-8'],
      user: 'admin'
    },
    {
      id: 'cert-5',
      name: 'Emergency Access',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
      expires: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      status: 'expired',
      vms: [],
      user: 'admin'
    }
  ];
  
  // Generate time series data for metrics
  export const generateMetricsData = (hours = 24, interval = 5, baseValue = 30, amplitude = 15) => {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < hours * 60 / interval; i++) {
      const timeOffset = i * interval * 60000;
      const time = new Date(now.getTime() - timeOffset);
      
      // Generate data with some variability
      const value = Math.max(0, Math.min(100, baseValue + Math.sin(i / 12) * amplitude + (Math.random() - 0.5) * 10));
      
      data.push({
        time: time.toISOString(),
        value: Math.round(value * 10) / 10
      });
    }
    
    // Return data in chronological order
    return data.reverse();
  };
  
  // Dashboard statistics
  export const mockDashboardStats = {
    overview: {
      totalVMs: mockVMs.length,
      runningVMs: mockVMs.filter(vm => vm.status === 'running').length,
      stoppedVMs: mockVMs.filter(vm => vm.status === 'stopped').length,
      avgCPU: Math.round(mockVMs.filter(vm => vm.status === 'running').reduce((sum, vm) => sum + vm.cpu, 0) / 
        mockVMs.filter(vm => vm.status === 'running').length),
      providers: {
        AWS: mockVMs.filter(vm => vm.provider === 'AWS').length,
        Azure: mockVMs.filter(vm => vm.provider === 'Azure').length,
        GCP: mockVMs.filter(vm => vm.provider === 'GCP').length,
        VMware: mockVMs.filter(vm => vm.provider === 'VMware').length
      }
    },
    resources: {
      cpu: {
        average: Math.round(mockVMs.filter(vm => vm.status === 'running').reduce((sum, vm) => sum + vm.cpu, 0) / 
          mockVMs.filter(vm => vm.status === 'running').length),
        data: generateMetricsData(24, 5, 40, 15)
      },
      ram: {
        average: Math.round(mockVMs.filter(vm => vm.status === 'running').reduce((sum, vm) => sum + vm.ram, 0) / 
          mockVMs.filter(vm => vm.status === 'running').length),
        data: generateMetricsData(24, 5, 50, 10)
      },
      disk: {
        average: Math.round(mockVMs.reduce((sum, vm) => sum + vm.disk, 0) / mockVMs.length),
        data: generateMetricsData(24, 5, 30, 5)
      },
      network: {
        average: Math.round(mockVMs.filter(vm => vm.status === 'running').reduce((sum, vm) => sum + vm.network, 0) / 
          mockVMs.filter(vm => vm.status === 'running').length),
        data: generateMetricsData(24, 5, 20, 20)
      }
    },
    activities: mockActivities
  };
  
  // VM details logs
  export const generateVMLogs = (vmId, count = 100) => {
    const logs = [];
    const now = new Date();
    const vm = mockVMs.find(vm => vm.id === vmId);
    
    if (!vm) return logs;
    
    const logTypes = [
      { type: 'info', message: ['System startup', 'Service started', 'Backup completed', 'Update available'] },
      { type: 'warning', message: ['High CPU usage', 'Low disk space', 'Memory usage high', 'Network latency increased'] },
      { type: 'error', message: ['Service failed to start', 'Connection timeout', 'Permission denied', 'Disk error detected'] }
    ];
    
    for (let i = 0; i < count; i++) {
      const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24 hours
      const logTypeIndex = Math.floor(Math.random() * 10) < 7 ? 0 : (Math.floor(Math.random() * 10) < 8 ? 1 : 2); // 70% info, 24% warning, 6% error
      const logType = logTypes[logTypeIndex];
      const messageIndex = Math.floor(Math.random() * logType.message.length);
      
      logs.push({
        id: `log-${vmId}-${i}`,
        timestamp: new Date(now.getTime() - timeOffset).toISOString(),
        type: logType.type,
        message: logType.message[messageIndex],
        details: `Details for ${logType.message[messageIndex]} on ${vm.name}`
      });
    }
    
    // Sort logs by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };
  
  // Generate terminal output for mock interaction
  export const generateTerminalOutput = (command) => {
    const outputMap = {
      'ls': 'app.js\nnode_modules\npackage.json\nREADME.md\ndist\nsrc\n',
      'ls -la': 'total 64\ndrwxr-xr-x  7 user user  224 Mar 15 10:30 .\ndrwxr-xr-x  3 user user   96 Mar 10 09:15 ..\n-rw-r--r--  1 user user  220 Mar 10 09:15 .bash_logout\n-rw-r--r--  1 user user 3771 Mar 10 09:15 .bashrc\n-rw-r--r--  1 user user  807 Mar 10 09:15 .profile\n-rw-r--r--  1 user user  942 Mar 15 10:25 app.js\ndrwxr-xr-x 61 user user 1952 Mar 15 10:20 node_modules\n-rw-r--r--  1 user user  493 Mar 15 10:20 package.json\n-rw-r--r--  1 user user 1521 Mar 15 10:15 README.md\ndrwxr-xr-x  2 user user   64 Mar 15 10:15 dist\ndrwxr-xr-x  3 user user   96 Mar 15 10:15 src\n',
      'pwd': '/home/user/app\n',
      'whoami': 'user\n',
      'date': new Date().toString() + '\n',
      'uname -a': 'Linux web-server-01 5.15.0-1019-aws #23-Ubuntu SMP Fri Sep 16 15:50:45 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux\n',
      'ps aux': 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.0 168452 12968 ?        Ss   10:30   0:02 /sbin/init\nroot         2  0.0  0.0      0     0 ?        S    10:30   0:00 [kthreadd]\nuser      1234  0.2  0.5 1274408 95644 ?      Ssl  10:35   0:15 node app.js\nuser      2345  0.0  0.1  14428  4208 pts/0   Ss   11:45   0:00 bash\nuser      3456  0.0  0.0  14648  3444 pts/0   R+   12:30   0:00 ps aux\n',
      'top -b -n 1': 'top - 12:30:45 up 2 hours, 5 users, load average: 0.08, 0.15, 0.10\nTasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  2.3 us,  1.2 sy,  0.0 ni, 96.4 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st\nMiB Mem :   7863.1 total,   4862.5 free,   1852.0 used,   1148.6 buff/cache\nMiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5714.8 avail Mem \n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 1234 user      20   0 1274408  93.4m  41.5m S   0.3   1.2   0:15.28 node\n    1 root      20   0  168452  12.6m   9.0m S   0.0   0.2   0:02.02 systemd\n    2 root      20   0       0      0      0 S   0.0   0.0   0:00.00 kthreadd\n',
      'df -h': 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        30G   10G   19G  35% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm\ntmpfs           1.6G  1.8M  1.6G   1% /run\ntmpfs           5.0M     0  5.0M   0% /run/lock\n',
      'free -m': '              total        used        free      shared  buff/cache   available\nMem:           7863        1852        4862          42        1148        5714\nSwap:          2048           0        2048\n',
      'ip a': '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n       valid_lft forever preferred_lft forever\n    inet6 ::1/128 scope host \n       valid_lft forever preferred_lft forever\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000\n    link/ether 06:f7:e4:a1:cf:be brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.10/24 brd 192.168.1.255 scope global dynamic eth0\n       valid_lft 3589sec preferred_lft 3589sec\n    inet6 fe80::4f7:e4ff:fea1:cfbe/64 scope link \n       valid_lft forever preferred_lft forever\n',
      'cat /etc/os-release': 'NAME="Ubuntu"\nVERSION="20.04.6 LTS (Focal Fossa)"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 20.04.6 LTS"\nVERSION_ID="20.04"\nHOME_URL="https://www.ubuntu.com/"\nSUPPORT_URL="https://help.ubuntu.com/"\nBUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"\nPRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"\nVERSION_CODENAME=focal\nUBUNTU_CODENAME=focal\n',
      'netstat -tulpn': '(Not all processes could be identified, non-owned process info\n will not be shown, you would have to be root to see it all.)\nActive Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      -\ntcp        0      0 127.0.0.1:27017         0.0.0.0:*               LISTEN      -\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      -\ntcp6       0      0 :::22                   :::*                    LISTEN      -\nudp        0      0 0.0.0.0:68              0.0.0.0:*                          -\n',
      'help': 'GNU bash, version 5.0.17(1)-release\nThese shell commands are defined internally.  Type `help\' to see this list.\nType `help name\' to find out more about the function `name\'.\nUse `info bash\' to find out more about the shell in general.\nUse `man -k\' or `info\' to find out more about commands not in this list.\n\nA star (*) next to a name means that the command is disabled.\n\n job_spec [&]                            history [-c] [-d offset] [n] or hist>\n (( expression ))                        if COMMANDS; then COMMANDS; [ elif C>\n . filename [arguments]                  jobs [-lnprs] [jobspec ...] or jobs >\n :                                       kill [-s sigspec | -n signum | -sigs>\n [ arg... ]                              let arg [arg ...]\n [[ expression ]]                        local [option] name[=value] ...\n alias [-p] [name[=value] ... ]          logout [n]\n bg [job_spec ...]                       mapfile [-d delim] [-n count] [-O or>\n bind [-lpsvPSVX] [-m keymap] [-f file>  popd [-n] [+N | -N]\n break [n]                               printf [-v var] format [arguments]\n builtin [shell-builtin [arg ...]]       pushd [-n] [+N | -N | dir]\n caller [expr]                           pwd [-LP]\n case WORD in [PATTERN [| PATTERN]...)>  read [-ers] [-a array] [-d delim] [->\n cd [-L|[-P [-e]] [-@]] [dir]            readarray [-d delim] [-n count] [-O >\n command [-pVv] command [arg ...]         readonly [-aAf] [name[=value] ...] o>\n compgen [-abcdefgjksuv] [-o option] [>  return [n]\n complete [-abcdefgjksuv] [-pr] [-DEI]>  select NAME [in WORDS ... ;] do COMM>\n compopt [-o|+o option] [-DEI] [name .>  set [-abefhkmnptuvxBCHP] [-o option->\n continue [n]                           shift [n]\n coproc [NAME] command [redirections]    shopt [-pqsu] [-o] [optname ...]\n declare [-aAfFgilnrtux] [-p] [name[=v>  source filename [arguments]\n dirs [-clpv] [+N] [-N]                  suspend [-f]\n disown [-h] [-ar] [jobspec ... | pid >  test [expr]\n echo [-neE] [arg ...]                   time [-p] pipeline\n enable [-a] [-dnps] [-f filename] [na>  times\n eval [arg ...]                          trap [-lp] [[arg] signal_spec ...]\n exec [-cl] [-a name] [command [argume>  true\n exit [n]                                type [-afptP] name [name ...]\n export [-fn] [name[=value] ...] or ex>  typeset [-aAfFgilnrtux] [-p] name[=v>\n false                                   ulimit [-SHabcdefiklmnpqrstuvxPT] [l>\n fc [-e ename] [-lnr] [first] [last] o>  umask [-p] [-S] [mode]\n fg [job_spec]                           unalias [-a] name [name ...]\n for NAME [in WORDS ... ] ; do COMMAND>  unset [-f] [-v] [-n] [name ...]\n for (( exp1; exp2; exp3 )); do COMMAN>  until COMMANDS; do COMMANDS; done\n function name { COMMANDS ; } or name (>  variables - Names and meanings of so>\n getopts optstring name [arg]            wait [-fn] [id ...]\n hash [-lr] [-p pathname] [-dt] [name >  while COMMANDS; do COMMANDS; done\n help [-dms] [pattern ...]               { COMMANDS ; }\n'
    };
    
    // Default response if command not found
    let output = `bash: command not found: ${command}\n`;
    
    // Check for known commands
    for (const cmd in outputMap) {
      if (command === cmd || command.startsWith(`${cmd} `)) {
        output = outputMap[cmd];
        break;
      }
    }
    
    return output;
  };
  
  // Mock terminal sessions
  export const mockTerminalSessions = [
    {
      id: 'session-1',
      vmId: 'vm-1',
      status: 'active',
      created: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      user: 'admin'
    },
    {
      id: 'session-2',
      vmId: 'vm-2',
      status: 'active',
      created: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      user: 'admin'
    },
    {
      id: 'session-3',
      vmId: 'vm-4',
      status: 'closed',
      created: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 minutes ago
      closed: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 60 minutes ago
      user: 'user'
    }
  ];