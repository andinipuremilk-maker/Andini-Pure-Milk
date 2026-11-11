// Unified Lucide-style Icon System for Andini Pure Milk POS
// All icons follow 24x24 viewBox, stroke-based 1.75px width, and crisp optical balance.

export function Icon({ path, size = 16, strokeWidth = 1.75, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      {path}
    </svg>
  );
}

// Brand & Products
export const IconMilk = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M8 2h8" />
        <path d="M9 2v3" />
        <path d="M15 2v3" />
        <path d="M7 5h10l1 4H6l1-4z" />
        <path d="M6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
        <path d="M10 14h4" />
      </>
    }
  />
);

export const IconStore = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <path d="M22 7a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2" />
      </>
    }
  />
);

// Navigation & Roles
export const IconDashboard = (props) => (
  <Icon
    {...props}
    path={
      <>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </>
    }
  />
);

export const IconCart = (props) => (
  <Icon
    {...props}
    path={
      <>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </>
    }
  />
);

export const IconTrendingUp = (props) => (
  <Icon
    {...props}
    path={
      <>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </>
    }
  />
);

export const IconTrendingDown = (props) => (
  <Icon
    {...props}
    path={
      <>
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
        <polyline points="16 17 22 17 22 11" />
      </>
    }
  />
);

export const IconPackage = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    }
  />
);

export const IconUsers = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    }
  />
);

export const IconUser = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    }
  />
);

export const IconShield = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </>
    }
  />
);

export const IconReceipt = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h6" />
      </>
    }
  />
);

export const IconFileText = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </>
    }
  />
);

// Actions & Controls
export const IconSearch = (props) => (
  <Icon
    {...props}
    path={
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    }
  />
);

export const IconPlus = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </>
    }
  />
);

export const IconMinus = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M5 12h14" />
      </>
    }
  />
);

export const IconEdit = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    }
  />
);

export const IconTrash = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </>
    }
  />
);

export const IconCheck = (props) => (
  <Icon
    {...props}
    path={
      <>
        <polyline points="20 6 9 17 4 12" />
      </>
    }
  />
);

export const IconX = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    }
  />
);

export const IconChevronDown = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    }
  />
);

export const IconChevronRight = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    }
  />
);

export const IconArrowLeft = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </>
    }
  />
);

export const IconArrowRight = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    }
  />
);

export const IconClock = (props) => (
  <Icon
    {...props}
    path={
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    }
  />
);

export const IconCalendar = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </>
    }
  />
);

export const IconPrinter = (props) => (
  <Icon
    {...props}
    path={
      <>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect width="12" height="8" x="6" y="14" />
      </>
    }
  />
);

export const IconLogOut = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </>
    }
  />
);

export const IconPause = (props) => (
  <Icon
    {...props}
    path={
      <>
        <rect width="4" height="16" x="6" y="4" rx="1" />
        <rect width="4" height="16" x="14" y="4" rx="1" />
      </>
    }
  />
);

export const IconAlertCircle = (props) => (
  <Icon
    {...props}
    path={
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </>
    }
  />
);

export const IconDownload = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </>
    }
  />
);

export const IconRefresh = (props) => (
  <Icon
    {...props}
    path={
      <>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </>
    }
  />
);

export const IconCreditCard = (props) => (
  <Icon
    {...props}
    path={
      <>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </>
    }
  />
);

export const IconQrCode = (props) => (
  <Icon
    {...props}
    path={
      <>
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
      </>
    }
  />
);

export const IconBanknote = (props) => (
  <Icon
    {...props}
    path={
      <>
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    }
  />
);

