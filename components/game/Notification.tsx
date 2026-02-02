import { NotificationData, NotificationType, ComponentVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Swords,
  X,
} from "lucide-react";

interface NotificationProps {
  notification: NotificationData;
  variant?: ComponentVariant;
  onDismiss?: (id: string) => void;
  className?: string;
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof Info; bgColor: string; borderColor: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bgColor: "bg-blue-950/50",
    borderColor: "border-blue-600/50",
    iconColor: "text-blue-400",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-950/50",
    borderColor: "border-green-600/50",
    iconColor: "text-green-400",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-950/50",
    borderColor: "border-yellow-600/50",
    iconColor: "text-yellow-400",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-950/50",
    borderColor: "border-red-600/50",
    iconColor: "text-red-400",
  },
  combat: {
    icon: Swords,
    bgColor: "bg-orange-950/50",
    borderColor: "border-orange-600/50",
    iconColor: "text-orange-400",
  },
};

export function Notification({
  notification,
  variant = "standard",
  onDismiss,
  className,
}: NotificationProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  // Compact variant - inline, minimal
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded border px-2 py-1",
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", config.iconColor)} />
        <span className="text-sm truncate">{notification.message}</span>
        {onDismiss && (
          <button
            className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  // Dramatic variant - larger, more prominent
  if (variant === "dramatic") {
    return (
      <div
        className={cn(
          "relative flex items-start gap-4 rounded-lg border-2 p-4 shadow-lg",
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <Icon className={cn("h-8 w-8", config.iconColor, "animate-pulse")} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg">{notification.title}</h4>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            {notification.message}
          </p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Standard variant (default)
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{notification.title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">
          {notification.message}
        </p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onDismiss(notification.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Component for displaying multiple notifications
interface NotificationListProps {
  notifications: NotificationData[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function NotificationList({
  notifications,
  onDismiss,
  className,
}: NotificationListProps) {
  if (notifications.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
