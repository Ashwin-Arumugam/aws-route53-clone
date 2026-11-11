"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Link from "@cloudscape-design/components/link";
import Input from "@cloudscape-design/components/input";
import FormField from "@cloudscape-design/components/form-field";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import ConsoleShell from "@/components/ConsoleShell";

export default function DashboardPage() {
  const router = useRouter();
  const [domainSearch, setDomainSearch] = useState("");
  const [notifFilter, setNotifFilter] = useState("");

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Dashboard", href: "/dashboard" },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          <Header
            variant="h1"
            info={<Link variant="info">Info</Link>}
          >
            Route 53 Dashboard
          </Header>

          <Container>
            <ColumnLayout columns={4} variant="default">
              <SpaceBetween size="m">
                <div>
                  <Box variant="h3">DNS management</Box>
                  <Box variant="p" color="text-status-inactive">
                    A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com.
                  </Box>
                </div>
                <Button onClick={() => router.push("/hosted-zones/create")}>
                  Create hosted zone
                </Button>
              </SpaceBetween>

              <SpaceBetween size="m">
                <div>
                  <Box variant="h3">Traffic management</Box>
                  <Box variant="p" color="text-status-inactive">
                    A visual tool that lets you easily create policies for multiple endpoints in complex configurations.
                  </Box>
                </div>
                <Button onClick={() => router.push("/traffic-policies")}>
                  Create policy
                </Button>
              </SpaceBetween>

              <SpaceBetween size="m">
                <div>
                  <Box variant="h3">Availability monitoring</Box>
                  <Box variant="p" color="text-status-inactive">
                    Health checks monitor your applications and web resources, and direct DNS queries to healthy resources.
                  </Box>
                </div>
                <Button onClick={() => router.push("/health-checks")}>
                  Create health check
                </Button>
              </SpaceBetween>

              <SpaceBetween size="m">
                <div>
                  <Box variant="h3">Domain registration</Box>
                  <Box variant="p" color="text-status-inactive">
                    A domain is the name, such as example.com, that your users use to access your application.
                  </Box>
                </div>
                <Button onClick={() => alert("Domain registration is simulated.")}>
                  Register domain
                </Button>
              </SpaceBetween>
            </ColumnLayout>
          </Container>

          <Container header={<Header variant="h2">Register domain</Header>}>
            <SpaceBetween size="m">
              <Box variant="p">
                Find and register an available domain, or transfer your existing domains to Route 53.
              </Box>
              <div style={{ maxWidth: "650px" }}>
                <FormField
                  constraintText="Each label (each part between dots) can be up to 63 characters long and must start with a-z or 0-9. Maximum length: 255 characters, including dots. Valid characters: a-z, 0-9, and - (hyphen)"
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.detail.value)}
                        placeholder="Enter a domain name"
                      />
                    </div>
                    <Button onClick={() => alert(`Checked availability for: ${domainSearch || "domain.com"}`)}>
                      Check
                    </Button>
                  </div>
                </FormField>
              </div>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h2">Notifications</Header>}>
            <Table
              columnDefinitions={[
                { id: "resource", header: "Resource", cell: (e: any) => e.resource },
                { id: "status", header: "Status", cell: (e: any) => e.status },
                { id: "last_update", header: "Last update", cell: (e: any) => e.last_update },
              ]}
              items={[]}
              filter={
                <TextFilter
                  filteringText={notifFilter}
                  onChange={(e) => setNotifFilter(e.detail.filteringText)}
                  filteringPlaceholder="Find notifications"
                />
              }
              empty={
                <Box textAlign="center" color="text-status-inactive" padding={{ vertical: "l" }}>
                  No notifications to display
                </Box>
              }
            />
          </Container>
        </SpaceBetween>
      }
    />
  );
}
