"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Select from "@cloudscape-design/components/select";
import Link from "@cloudscape-design/components/link";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import { FlashbarProps } from "@cloudscape-design/components/flashbar";
import ConsoleShell from "@/components/ConsoleShell";
import { api } from "@/lib/api";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const [domainName, setDomainName] = useState("");
  const [description, setDescription] = useState("");
  const [zoneType, setZoneType] = useState<"Public" | "Private">("Public");
  const [vpcRegion, setVpcRegion] = useState({ label: "US East (N. Virginia) [us-east-1]", value: "us-east-1" });
  const [vpcId, setVpcId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [flashItems, setFlashItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) {
      setErrorText("Domain name is required.");
      return;
    }

    try {
      setLoading(true);
      setErrorText("");
      const created = await api.createHostedZone({
        name: domainName.trim(),
        description: description.trim(),
        type: zoneType,
      });

      router.push(`/hosted-zones/${created.id}`);
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to create hosted zone.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Hosted zones", href: "/hosted-zones" },
            { text: "Create hosted zone", href: "/hosted-zones/create" },
          ]}
        />
      }
      flashItems={flashItems}
      content={
        <form onSubmit={handleSubmit}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => router.push("/hosted-zones")}>
                  Cancel
                </Button>
                <Button variant="primary" loading={loading} formAction="submit">
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
            header={
              <Header
                variant="h1"
                info={<Link variant="info">Info</Link>}
                description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
              >
                Create hosted zone
              </Header>
            }
          >
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Hosted zone configuration</Header>}>
                <SpaceBetween size="l">
                  <FormField
                    label={
                      <span>
                        Domain name <Link variant="info">Info</Link>
                      </span>
                    }
                    description="This is the name of the domain that you want to route traffic for."
                    constraintText={"Valid characters: a-z, 0-9, ! \" # $ % & ' ( ) * + , - / : ; < = > ? @ [ \\ ] ^ _ ` { | } ~ ."}
                    errorText={errorText}
                  >
                    <Input
                      value={domainName}
                      onChange={(e) => setDomainName(e.detail.value)}
                      placeholder="abc.com"
                    />
                  </FormField>

                  <FormField
                    label={
                      <span>
                        Description - <i>optional</i> <Link variant="info">Info</Link>
                      </span>
                    }
                    description="This value lets you distinguish hosted zones that have the same name."
                    constraintText={`The description can have up to 256 characters. ${description.length}/256`}
                  >
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.detail.value.slice(0, 256))}
                      placeholder="The hosted zone is used for..."
                      rows={3}
                    />
                  </FormField>

                  <FormField
                    label={
                      <span>
                        Type <Link variant="info">Info</Link>
                      </span>
                    }
                    description="The type indicates whether you want to route traffic on the internet or in an Amazon VPC."
                  >
                    <ColumnLayout columns={2}>
                      <div
                        className={`aws-selectable-tile ${zoneType === "Public" ? "selected" : ""}`}
                        onClick={() => setZoneType("Public")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "4px" }}>
                          <input
                            type="radio"
                            name="zoneType"
                            checked={zoneType === "Public"}
                            onChange={() => setZoneType("Public")}
                          />
                          Public hosted zone
                        </div>
                        <Box variant="p" color="text-status-inactive">
                          A public hosted zone determines how traffic is routed on the internet.
                        </Box>
                      </div>

                      <div
                        className={`aws-selectable-tile ${zoneType === "Private" ? "selected" : ""}`}
                        onClick={() => setZoneType("Private")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "4px" }}>
                          <input
                            type="radio"
                            name="zoneType"
                            checked={zoneType === "Private"}
                            onChange={() => setZoneType("Private")}
                          />
                          Private hosted zone
                        </div>
                        <Box variant="p" color="text-status-inactive">
                          A private hosted zone determines how traffic is routed within an Amazon VPC.
                        </Box>
                      </div>
                    </ColumnLayout>
                  </FormField>

                  {zoneType === "Private" && (
                    <Container header={<Header variant="h3">VPCs to associate with the hosted zone</Header>}>
                      <SpaceBetween size="m">
                        <FormField label="VPC Region">
                          <Select
                            selectedOption={vpcRegion}
                            onChange={(e) => setVpcRegion(e.detail.selectedOption as any)}
                            options={[
                              { label: "US East (N. Virginia) [us-east-1]", value: "us-east-1" },
                              { label: "US West (Oregon) [us-west-2]", value: "us-west-2" },
                              { label: "EU (Ireland) [eu-west-1]", value: "eu-west-1" },
                            ]}
                          />
                        </FormField>
                        <FormField label="VPC ID">
                          <Input
                            value={vpcId}
                            onChange={(e) => setVpcId(e.detail.value)}
                            placeholder="vpc-0123456789abcdef0"
                          />
                        </FormField>
                      </SpaceBetween>
                    </Container>
                  )}
                </SpaceBetween>
              </Container>

              <Container
                header={
                  <Header
                    variant="h2"
                    info={<Link variant="info">Info</Link>}
                    description="Apply tags to hosted zones to help organize and identify them."
                  >
                    Tags
                  </Header>
                }
              >
                <SpaceBetween size="s">
                  <Box variant="p" color="text-status-inactive">
                    No tags associated with the resource.
                  </Box>
                  <Button onClick={() => alert("Tag added")}>Add tag</Button>
                  <Box variant="small" color="text-status-inactive">
                    You can add up to 50 more tags.
                  </Box>
                </SpaceBetween>
              </Container>
            </SpaceBetween>
          </Form>
        </form>
      }
    />
  );
}
