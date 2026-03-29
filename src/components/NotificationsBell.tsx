"use client";

import { useEffect, useState } from "react";
import { Badge, Popover, List, Button } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsBell({ user }: { user: any }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.matricula) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.matricula)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && !error) {
      setNotifications(data as Notification[]);
    }
  };

  // Busca inicial e polling simples (a cada 30 segundos) para garantir atualizações
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.matricula]);

  // Se o usuário abrir o popover, dá um refresh também
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async () => {
    if (!user?.matricula) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Atualização otimista
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .in('id', unreadIds);
  };

  const content = (
    <div className="w-80 flex flex-col font-sans">
      <div className="flex justify-between items-center mb-3 px-1 pt-1">
        <strong className="text-zinc-800 text-base">Notificações</strong>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small" 
            icon={<CheckOutlined />} 
            onClick={handleMarkAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 p-0"
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 max-h-72">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-sm">Nenhuma notificação encontrada.</div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            rowKey="id"
            renderItem={(item) => (
              <List.Item
                className={`!px-3 !py-3 border-b border-b-zinc-100 hover:bg-zinc-50 transition-colors ${!item.read ? 'bg-blue-50/30' : ''}`}
                style={{ padding: '12px', borderBottom: '1px solid #f4f4f5' }}
              >
                <div className="flex flex-col gap-1 w-full pl-3 relative">
                  {!item.read && <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-500" />}
                  <div className={`text-sm ${!item.read ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                    {item.message}
                  </div>
                  <div className={`text-[11px] ${!item.read ? 'text-blue-600 font-medium' : 'text-zinc-400'}`}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayInnerStyle={{ padding: '12px 12px 0 12px', borderRadius: '12px', overflow: 'hidden' }}
    >
      <div className="p-2 mr-1 rounded-full hover:bg-zinc-100 cursor-pointer transition-colors flex items-center justify-center">
        <Badge count={unreadCount} size="small" offset={[-2, 4]}>
          <BellOutlined style={{ fontSize: '20px', color: '#52525b' }} />
        </Badge>
      </div>
    </Popover>
  );
}
