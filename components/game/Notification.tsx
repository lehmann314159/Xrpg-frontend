import { NotificationData, NotificationType } from "@/lib/types";
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
  onDismiss,
  className,
}: NotificationProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

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
