"use client";

interface SidebarNavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

export default function SidebarNavItem({ icon: Icon, label, active = false }: SidebarNavItemProps) {
  return (
    <button
      title={label}
      style={active ? {
        background: "var(--nav-active-bg)",
        color: "var(--nav-active-color)",
        border: "1px solid var(--nav-active-border)",
      } : {}}
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? ""
          : "hover:bg-black/10"
      }`}
    >
      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.8}
        color={active ? undefined : "var(--icon-color)"}
      />
    </button>
  );
}
