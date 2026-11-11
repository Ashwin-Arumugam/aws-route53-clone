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

export default function TrafficPoliciesPage() {
  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Traffic policies", href: "/traffic-policies" },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Traffic Flow Feature"
          >
            Create sophisticated routing configurations for your resources using existing routing types.{" "}
            <strong>(Mocked section per assignment specification)</strong>.
          </Alert>

          <Table
            header={
              <Header
                variant="awsui-h1-sticky"
                counter="(0)"
                info={<Link variant="info">Info</Link>}
                description="Create sophisticated routing configurations for your resources using existing routing types."
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button disabled>Delete traffic policy</Button>
                    <Button disabled>Create policy records</Button>
                    <Button variant="primary" onClick={() => alert("Create traffic policy simulated")}>
                      Create traffic policy
                    </Button>
                  </SpaceBetween>
                }
              >
                Traffic policies
              </Header>
            }
            columnDefinitions={[
              { id: "name", header: "Name", cell: () => "-" },
              { id: "versions", header: "Number of versions", cell: () => "-" },
            ]}
            items={[]}
            empty={
              <Box textAlign="center" color="inherit" padding={{ vertical: "l" }}>
                <b>No traffic policies</b>
                <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                  There are no traffic policies created for this account.
                </Box>
                <Button variant="primary" onClick={() => alert("Create traffic policy simulated")}>
                  Create traffic policy
                </Button>
              </Box>
            }
          />
        </SpaceBetween>
      }
    />
  );
}
