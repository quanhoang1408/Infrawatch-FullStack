// Main index.js for components directory
// Import components from each subdirectory

// Common components
import {
    Button,
    Card,
    Dropdown,
    Modal,
    Notification,
    NotificationPanel,
    ProtectedRoute,
    Search,
    Spinner,
    StatusBadge,
    Tooltip,
    Table,
    Tabs,
    EmptyState,
    ErrorState
  } from './common';
  
  // Layout components
  import {
    MainLayout,
    Sidebar,
    Header,
    Footer,
    PageHeader,
    BreadcrumbNav
  } from './layout';
  
  // Chart components
  import {
    LineChart,
    AreaChart,
    BarChart,
    PieChart,
    GaugeChart,
    SparklineChart,
    ChartTooltip,
    ChartLegend,
    TimeRangeSelector
  } from './charts';
  
  // Dashboard components
  import {
    StatCard,
    ActivityList,
    ResourceUsage,
    SystemHealthCard,
    ProviderDistribution,
    DashboardFilter
  } from './dashboard';
  
  // VM components
  import {
    VMTable,
    VMActions,
    VMStatusBadge,
    VMCardInfo,
    VMResourceMonitor,
    VMFilterBar,
    VMTypeTag,
    VMDetailHeader,
    VMLogViewer,
    ProviderIcon,
    CreateVMModal,
    VMConfirmationModal
  } from './vm';
  
  // Terminal components
  import {
    Terminal,
    TerminalToolbar,
    ConnectionStatus,
    CommandHistory,
    TerminalContextMenu,
    TerminalSettings
  } from './terminal';
  
  // Form components
  import {
    FormItem,
    FormSection,
    InputWithIcon,
    ValidationInput,
    DatePicker,
    Select,
    VMSelector,
    FileUpload
  } from './form';
  
  // Certificate components
  import {
    CertificateCard,
    CertificateForm,
    CertificateList,
    CertificateDetail,
    CertificateActions
  } from './certificates';
  
  // Feedback components
  import {
    Toast,
    Alert,
    ConfirmationDialog,
    ProgressIndicator
  } from './feedback';
  
  // Export all components grouped by category
  export {
    // Common
    Button,
    Card,
    Dropdown,
    Modal,
    Notification,
    NotificationPanel,
    ProtectedRoute,
    Search,
    Spinner,
    StatusBadge,
    Tooltip,
    Table,
    Tabs,
    EmptyState,
    ErrorState,
  
    // Layout
    MainLayout,
    Sidebar,
    Header,
    Footer,
    PageHeader,
    BreadcrumbNav,
  
    // Charts
    LineChart,
    AreaChart,
    BarChart,
    PieChart,
    GaugeChart,
    SparklineChart,
    ChartTooltip,
    ChartLegend,
    TimeRangeSelector,
  
    // Dashboard
    StatCard,
    ActivityList,
    ResourceUsage,
    SystemHealthCard,
    ProviderDistribution,
    DashboardFilter,
  
    // VM
    VMTable,
    VMActions,
    VMStatusBadge,
    VMCardInfo,
    VMResourceMonitor,
    VMFilterBar,
    VMTypeTag,
    VMDetailHeader,
    VMLogViewer,
    ProviderIcon,
    CreateVMModal,
    VMConfirmationModal,
  
    // Terminal
    Terminal,
    TerminalToolbar,
    ConnectionStatus,
    CommandHistory,
    TerminalContextMenu,
    TerminalSettings,
  
    // Form
    FormItem,
    FormSection,
    InputWithIcon,
    ValidationInput,
    DatePicker,
    Select,
    VMSelector,
    FileUpload,
  
    // Certificate
    CertificateCard,
    CertificateForm,
    CertificateList,
    CertificateDetail,
    CertificateActions,
  
    // Feedback
    Toast,
    Alert,
    ConfirmationDialog,
    ProgressIndicator
  };
  
  // Group exports by category for named imports
  export const Common = {
    Button,
    Card,
    Dropdown,
    Modal,
    Notification,
    NotificationPanel,
    ProtectedRoute,
    Search,
    Spinner,
    StatusBadge,
    Tooltip,
    Table,
    Tabs,
    EmptyState,
    ErrorState
  };
  
  export const Layout = {
    MainLayout,
    Sidebar,
    Header,
    Footer,
    PageHeader,
    BreadcrumbNav
  };
  
  export const Charts = {
    LineChart,
    AreaChart,
    BarChart,
    PieChart,
    GaugeChart,
    SparklineChart,
    ChartTooltip,
    ChartLegend,
    TimeRangeSelector
  };
  
  export const Dashboard = {
    StatCard,
    ActivityList,
    ResourceUsage,
    SystemHealthCard,
    ProviderDistribution,
    DashboardFilter
  };
  
  export const VM = {
    VMTable,
    VMActions,
    VMStatusBadge,
    VMCardInfo,
    VMResourceMonitor,
    VMFilterBar,
    VMTypeTag,
    VMDetailHeader,
    VMLogViewer,
    ProviderIcon,
    CreateVMModal,
    VMConfirmationModal
  };
  
  export const TerminalComponents = {
    Terminal,
    TerminalToolbar,
    ConnectionStatus,
    CommandHistory,
    TerminalContextMenu,
    TerminalSettings
  };
  
  export const Form = {
    FormItem,
    FormSection,
    InputWithIcon,
    ValidationInput,
    DatePicker,
    Select,
    VMSelector,
    FileUpload
  };
  
  export const Certificate = {
    CertificateCard,
    CertificateForm,
    CertificateList,
    CertificateDetail,
    CertificateActions
  };
  
  export const Feedback = {
    Toast,
    Alert,
    ConfirmationDialog,
    ProgressIndicator
  };
  
  // Default export with all components
  export default {
    Common,
    Layout,
    Charts,
    Dashboard,
    VM,
    Terminal: TerminalComponents,
    Form,
    Certificate,
    Feedback
  };