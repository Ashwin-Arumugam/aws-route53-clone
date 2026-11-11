"use client";

import React from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Link from "@cloudscape-design/components/link";
import Alert from "@cloudscape-design/components/alert";
import ConsoleShell from "@/components/ConsoleShell";

export default function HealthChecksPage() {
  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Health checks", href: "/health-checks" },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Health Checks Feature"
          >
            Route 53 health checks monitor the health and performance of your application&apos;s servers and endpoints.{" "}
            <strong>(Mocked section per assignment specification)</strong>.
          </Alert>

          <Table
            header={
              <Header
                variant="awsui-h1-sticky"
                counter="(0)"
                info={<Link variant="info">Info</Link>}
                description="Route 53 health checks monitor the health and performance of your application's servers and endpoints."
                actions={
                  <Button variant="primary" onClick={() => alert("Create health check simulated")}>
                    Create health check
                  </Button>
                }
              >
                Health checks
              </Header>
            }
            columnDefinitions={[
              { id: "id", header: "ID", cell: () => "-" },
              { id: "name", header: "Name", cell: () => "-" },
              { id: "state", header: "State", cell: () => "-" },
              { id: "details", header: "Details", cell: () => "-" },
              { id: "status_24h", header: "Status in last 24 hours", cell: () => "-" },
              { id: "current_status", header: "Current status", cell: () => "-" },
              { id: "alarm", header: "Alarm", cell: () => "-" },
              { id: "actions", header: "Actions", cell: () => "-" },
            ]}
            items={[]}
            empty={
              <Box textAlign="center" color="inherit" padding={{ vertical: "l" }}>
                <b>No health checks</b>
                <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                  There are no health checks created for this account.
                </Box>
                <Button variant="primary" onClick={() => alert("Create health check simulated")}>
                  Create health check
                </Button>
              </Box>
            }
          />
        </SpaceBetween>
      }
    />
  );
}
