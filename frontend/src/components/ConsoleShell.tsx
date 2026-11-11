"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import AppLayout, { AppLayoutProps } from "@cloudscape-design/components/app-layout";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Input from "@cloudscape-design/components/input";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { api, User } from "@/lib/api";

interface ConsoleShellProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  breadcrumbs?: AppLayoutProps["breadcrumbs"];
  headerSelector?: string;
  tools?: React.ReactNode;
  toolsOpen?: boolean;
  onToolsChange?: (isOpen: boolean) => void;
  flashItems?: FlashbarProps.MessageDefinition[];
}

export default function ConsoleShell({
  content,
  children,
  breadcrumbs,
  tools,
  toolsOpen,
  onToolsChange,
  flashItems = [],
}: ConsoleShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("aws_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {}
    } else {
      api.getCurrentUser().then((u) => {
        if (u) {
          setUser(u);
          localStorage.setItem("aws_user", JSON.stringify(u));
        }
      });
    }

    const savedTheme = localStorage.getItem("aws_theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      applyMode(Mode.Dark);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    applyMode(nextDark ? Mode.Dark : Mode.Light);
    localStorage.setItem("aws_theme", nextDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNavigation
        identity={{
          href: "/hosted-zones",
          title: "Amazon Route 53",
          logo: {
            src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='%23FF9900'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>",
            alt: "Route 53",
          },
        }}
        search={
          <Input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.detail.value)}
            placeholder="Search for services, features, docs [Alt+S]"
            ariaLabel="Search"
          />
        }
        utilities={[
          {
            type: "menu-dropdown",
            iconName: "notification",
            title: "Notifications",
            ariaLabel: "Notifications",
            items: [
              { id: "notif-0", text: "No unread notifications" },
            ],
          },
          {
            type: "menu-dropdown",
            iconName: "status-info",
            title: "Documentation & Support",
            ariaLabel: "Support",
            items: [
              { id: "docs", text: "Route 53 Documentation", href: "https://docs.aws.amazon.com/route53/", external: true },
              { id: "support", text: "AWS Support Center" },
            ],
          },
          {
            type: "button",
            text: isDarkMode ? "Light Mode" : "Dark Mode",
            iconName: isDarkMode ? "status-positive" : "settings",
            onClick: toggleTheme,
          },
          {
            type: "button",
            text: "Global",
            title: "Region: Global (Route 53 does not require region selection)",
            iconName: "globe",
          },
          {
            type: "menu-dropdown",
            text: user ? `${user.username} @ ${user.aws_account_id}` : "AWS Management Console",
            description: user ? `${user.role}` : "Session",
            iconName: "user-profile",
            onItemClick: (e) => {
              if (e.detail.id === "signout") handleLogout();
              if (e.detail.id === "login") router.push("/login");
            },
            items: [
              { id: "account", text: `Account ID: ${user?.aws_account_id || "1234-5678-9012"}` },
              { id: "role", text: `Role: ${user?.role || "AdministratorAccess"}` },
              { id: "login", text: "Switch User / Sign In" },
              { id: "signout", text: "Sign out" },
            ],
          },
        ]}
      />

      <AppLayout
        headerSelector="#top-nav"
        breadcrumbs={breadcrumbs}
        notifications={flashItems.length > 0 ? <Flashbar items={flashItems} /> : undefined}
        navigation={
          <SideNavigation
            activeHref={pathname}
            header={{ href: "/hosted-zones", text: "Route 53" }}
            items={[
              { type: "link", text: "Dashboard", href: "/dashboard" },
              { type: "link", text: "Hosted zones", href: "/hosted-zones" },
              { type: "link", text: "Health checks", href: "/health-checks" },
              { type: "link", text: "Profiles", href: "/profiles" },
              {
                type: "section",
                text: "Traffic flow",
                items: [
                  { type: "link", text: "Traffic policies", href: "/traffic-policies" },
                  { type: "link", text: "Policy records", href: "/traffic-policies" },
                ],
              },
              {
                type: "section",
                text: "Resolver",
                items: [
                  { type: "link", text: "VPCs", href: "/resolver" },
                  { type: "link", text: "Inbound endpoints", href: "/resolver" },
                  { type: "link", text: "Outbound endpoints", href: "/resolver" },
                  { type: "link", text: "Rules", href: "/resolver" },
                  { type: "link", text: "Query logging", href: "/resolver" },
                ],
              },
            ]}
          />
        }
        content={content}
        tools={tools}
        toolsOpen={toolsOpen}
        onToolsChange={(e) => onToolsChange && onToolsChange(e.detail.open)}
      />
      {children}
    </div>
  );
}
