"use client";

import React from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Link from "@cloudscape-design/components/link";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import ConsoleShell from "@/components/ConsoleShell";

export default function ResolverPage() {
  const sampleVpcs = [
    {
      id: "vpc-0a1b2c3d4e5f67890",
      name: "Default VPC",
      rules: "0",
      outbound: "0",
      inbound: "0",
      query_logging_status: "Disabled",
      query_logging_configs: "0",
      dns_firewall_groups: "0",
      dns_firewall_fail_open: "Disabled",
      dnssec_validation: "Disabled",
      autodefined_reverse: "Enabled",
    },
  ];

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Resolver", href: "/resolver" },
            { text: "VPCs", href: "/resolver" },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Route 53 Resolver"
          >
            Route 53 Resolver automatically answers DNS queries for your Amazon VPCs and routes queries between VPCs and your on-premises network.{" "}
            <strong>(Mocked section per assignment specification)</strong>.
          </Alert>

          <Table
            header={
              <Header
                variant="awsui-h1-sticky"
                counter={`(${sampleVpcs.length})`}
                info={<Link variant="info">Info</Link>}
              >
                VPCs
              </Header>
            }
            columnDefinitions={[
              {
                id: "id",
                header: "ID",
                cell: (item) => (
                  <span style={{ color: "#0073bb", fontWeight: 600 }}>{item.id}</span>
                ),
              },
              { id: "name", header: "Name", cell: (item) => item.name },
              { id: "rules", header: "Rules", cell: (item) => item.rules },
              { id: "outbound", header: "Outbound endpoints", cell: (item) => item.outbound },
              { id: "inbound", header: "Inbound endpoints", cell: (item) => item.inbound },
              {
                id: "query_logging_status",
                header: "Query logging status",
                cell: (item) => <Badge color="grey">{item.query_logging_status}</Badge>,
              },
              { id: "query_logging_configs", header: "Query logging configs", cell: (item) => item.query_logging_configs },
              { id: "dns_firewall_groups", header: "DNS Firewall rule groups", cell: (item) => item.dns_firewall_groups },
              { id: "dns_firewall_fail_open", header: "DNS Firewall fail open", cell: (item) => item.dns_firewall_fail_open },
              { id: "dnssec_validation", header: "DNSSEC validation", cell: (item) => item.dnssec_validation },
              { id: "autodefined_reverse", header: "Autodefined Reverse", cell: (item) => item.autodefined_reverse },
            ]}
            items={sampleVpcs}
          />
        </SpaceBetween>
      }
    />
  );
}
