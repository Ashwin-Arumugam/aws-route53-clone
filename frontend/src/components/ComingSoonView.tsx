"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import ConsoleShell from "@/components/ConsoleShell";
import { useRouter } from "next/navigation";

interface PlaceholderProps {
  title: string;
  description: string;
  breadcrumbText: string;
  path: string;
}

export function ComingSoonView({ title, description, breadcrumbText, path }: PlaceholderProps) {
  const router = useRouter();

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: breadcrumbText, href: path },
          ]}
        />
      }
      content={
        <Container
          header={
            <Header variant="h1" description={description}>
              {title}
            </Header>
          }
        >
          <Box textAlign="center" padding={{ vertical: "xxl" }}>
            <SpaceBetween size="m">
              <Box variant="h3">Feature coming soon</Box>
              <Box variant="p" color="text-status-inactive">
                This feature isn&apos;t available in this demo.{" "}
                <strong>(Mocked section per assignment specification)</strong>.
              </Box>
              <Button variant="primary" onClick={() => router.push("/hosted-zones")}>
                Go to Hosted zones
              </Button>
            </SpaceBetween>
          </Box>
        </Container>
      }
    />
  );
}
