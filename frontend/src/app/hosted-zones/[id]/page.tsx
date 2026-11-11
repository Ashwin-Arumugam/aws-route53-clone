"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Container from "@cloudscape-design/components/container";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Badge from "@cloudscape-design/components/badge";
import Tabs from "@cloudscape-design/components/tabs";
import Toggle from "@cloudscape-design/components/toggle";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Link from "@cloudscape-design/components/link";
import { FlashbarProps } from "@cloudscape-design/components/flashbar";
import { useCollection } from "@cloudscape-design/collection-hooks";
import ConsoleShell from "@/components/ConsoleShell";
import { api, HostedZone, DNSRecord } from "@/lib/api";

const RECORD_TYPES: SelectProps.Option[] = [
  { value: "A", label: "A - Routes traffic to an IPv4 address" },
  { value: "AAAA", label: "AAAA - Routes traffic to an IPv6 address" },
  { value: "CNAME", label: "CNAME - Routes traffic to another domain name" },
  { value: "TXT", label: "TXT - Enter text strings (SPF, verification, etc.)" },
  { value: "MX", label: "MX - Routes email traffic to mail servers" },
  { value: "NS", label: "NS - Name servers for the hosted zone" },
  { value: "PTR", label: "PTR - Resolves IP addresses to domain names" },
  { value: "SRV", label: "SRV - Identifies specific service hosts" },
  { value: "CAA", label: "CAA - Restricts which CAs can issue certificates" },
];

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DNSRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<SelectProps.Option | null>(null);
  const [flashItems, setFlashItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [recordNamePrefix, setRecordNamePrefix] = useState("");
  const [selectedType, setSelectedType] = useState<SelectProps.Option>(RECORD_TYPES[0]);
  const [recordTtl, setRecordTtl] = useState("300");
  const [recordValues, setRecordValues] = useState("");
  const [isAlias, setIsAlias] = useState(false);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecordValues, setEditRecordValues] = useState("");
  const [editRecordTtl, setEditRecordTtl] = useState("300");
  const [isEditingRecord, setIsEditingRecord] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteZoneModalVisible, setDeleteZoneModalVisible] = useState(false);
  const [deleteZoneConfirm, setDeleteZoneConfirm] = useState("");
  const [isDeletingZone, setIsDeletingZone] = useState(false);

  const [editZoneModalVisible, setEditZoneModalVisible] = useState(false);
  const [editZoneDesc, setEditZoneDesc] = useState("");
  const [isEditingZone, setIsEditingZone] = useState(false);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [bindText, setBindText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedBindText, setExportedBindText] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [z, r] = await Promise.all([
        api.getHostedZone(zoneId),
        api.getRecords(zoneId, undefined, typeFilter?.value),
      ]);
      setZone(z);
      setRecords(r);
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to load records.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId) loadData();
  }, [zoneId, typeFilter]);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    records,
    {
      filtering: {
        empty: "No records found",
        noMatch: "No matches found",
        filteringFunction: (item, text) => {
          const lower = text.toLowerCase();
          return item.name.toLowerCase().includes(lower) || item.values.toLowerCase().includes(lower);
        },
      },
      pagination: { pageSize: 10 },
      sorting: { defaultState: { sortingColumn: { sortingField: "name" }, isDescending: false } },
      selection: {},
    }
  );

  const handleCreateRecord = async () => {
    if (!recordValues.trim()) {
      alert("Please enter a record value.");
      return;
    }
    try {
      setIsCreatingRecord(true);
      const baseDomain = zone?.name.replace(/\.$/, "") || "";
      const fullName = recordNamePrefix.trim()
        ? `${recordNamePrefix.trim()}.${baseDomain}.`
        : `${baseDomain}.`;

      await api.createRecord(zoneId, {
        name: fullName,
        type: selectedType.value || "A",
        ttl: parseInt(recordTtl, 10) || 300,
        routing_policy: "Simple",
        values: recordValues.trim(),
      });

      setFlashItems([
        {
          type: "success",
          content: `Created ${selectedType.value} record for ${fullName}`,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setCreateModalVisible(false);
      setRecordNamePrefix("");
      setRecordValues("");
      loadData();
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to create DNS record.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleEditRecord = async () => {
    if (selectedItems.length !== 1) return;
    const target = selectedItems[0];
    try {
      setIsEditingRecord(true);
      await api.updateRecord(zoneId, target.id, {
        values: editRecordValues.trim(),
        ttl: parseInt(editRecordTtl, 10) || 300,
      });

      setFlashItems([
        {
          type: "success",
          content: `Updated record ${target.name}`,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setEditModalVisible(false);
      setSelectedItems([]);
      loadData();
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to update record.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsEditingRecord(false);
    }
  };

  const handleDeleteRecords = async () => {
    if (selectedItems.length === 0) return;
    try {
      setIsDeleting(true);
      if (selectedItems.length === 1) {
        await api.deleteRecord(zoneId, selectedItems[0].id);
      } else {
        await api.bulkDeleteRecords(zoneId, selectedItems.map((s) => s.id));
      }

      setFlashItems([
        {
          type: "success",
          content: `Deleted ${selectedItems.length} record(s).`,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setDeleteModalVisible(false);
      setSelectedItems([]);
      loadData();
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to delete record(s).",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteZone = async () => {
    try {
      setIsDeletingZone(true);
      await api.deleteHostedZone(zoneId);
      router.push("/hosted-zones");
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to delete hosted zone.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsDeletingZone(false);
      setDeleteZoneModalVisible(false);
    }
  };

  const handleUpdateZone = async () => {
    try {
      setIsEditingZone(true);
      await api.updateHostedZone(zoneId, { description: editZoneDesc });
      setFlashItems([
        {
          type: "success",
          content: "Updated hosted zone description.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setEditZoneModalVisible(false);
      loadData();
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to update hosted zone.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsEditingZone(false);
    }
  };

  const handleExportBind = async () => {
    try {
      const res = await api.exportBind(zoneId);
      setExportedBindText(res.bind_content);
      setExportModalVisible(true);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

  const handleImportBind = async () => {
    if (!bindText.trim()) return;
    try {
      setIsImporting(true);
      const res = await api.importBind(zoneId, bindText);
      setFlashItems([
        {
          type: "success",
          content: res.message,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setImportModalVisible(false);
      setBindText("");
      loadData();
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to import BIND file.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Hosted zones", href: "/hosted-zones" },
            { text: zone ? zone.name.replace(/\.$/, "") : zoneId, href: `/hosted-zones/${zoneId}` },
          ]}
        />
      }
      flashItems={flashItems}
      content={
        <SpaceBetween size="l">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Badge color={zone?.type === "Public" ? "blue" : "grey"}>
                {zone?.type || "Public"}
              </Badge>
              <span style={{ fontSize: "24px", fontWeight: 700 }}>
                {zone ? zone.name.replace(/\.$/, "") : zoneId}
              </span>
              <Link variant="info">Info</Link>
            </div>
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteZoneModalVisible(true)}>Delete zone</Button>
              <Button onClick={() => alert("Test record simulated")}>Test record</Button>
              <Button onClick={() => alert("Query logging simulated")}>Configure query logging</Button>
            </SpaceBetween>
          </div>

          <Container>
            <ExpandableSection
              headerText="Hosted zone details"
              defaultExpanded={false}
              headerActions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      setEditZoneDesc(zone?.description || "");
                      setEditZoneModalVisible(true);
                    }}
                  >
                    Edit hosted zone
                  </Button>
                  <Button onClick={handleExportBind}>Export zone (BIND)</Button>
                </SpaceBetween>
              }
            >
              <ColumnLayout columns={4} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">Hosted zone name</Box>
                  <Box variant="p"><b>{zone?.name || "-"}</b></Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Hosted zone ID</Box>
                  <Box variant="p">{zone?.id || "-"}</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Type</Box>
                  <Box variant="p">{zone?.type || "Public"}</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Record count</Box>
                  <Box variant="p">{records.length}</Box>
                </div>
              </ColumnLayout>
            </ExpandableSection>
          </Container>

          <Tabs
            tabs={[
              {
                id: "records",
                label: `Records (${records.length})`,
                content: (
                  <Table
                    {...collectionProps}
                    header={
                      <Header
                        variant="awsui-h1-sticky"
                        counter={`(${records.length})`}
                        info={<Link variant="info">Info</Link>}
                        actions={
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button iconName="refresh" onClick={loadData} ariaLabel="Refresh" />
                            <Button
                              disabled={selectedItems.length !== 1}
                              onClick={() => {
                                setEditRecordValues(selectedItems[0].values);
                                setEditRecordTtl(selectedItems[0].ttl.toString());
                                setEditModalVisible(true);
                              }}
                            >
                              Edit record
                            </Button>
                            <Button
                              disabled={selectedItems.length === 0}
                              onClick={() => setDeleteModalVisible(true)}
                            >
                              Delete record
                            </Button>
                            <Button onClick={() => setImportModalVisible(true)}>
                              Import zone file
                            </Button>
                            <Button variant="primary" onClick={() => setCreateModalVisible(true)}>
                              Create record
                            </Button>
                          </SpaceBetween>
                        }
                      >
                        Records
                      </Header>
                    }
                    columnDefinitions={[
                      {
                        id: "name",
                        header: "Record name",
                        cell: (item) => <b>{item.name}</b>,
                        sortingField: "name",
                      },
                      {
                        id: "type",
                        header: "Type",
                        cell: (item) => item.type,
                        sortingField: "type",
                      },
                      {
                        id: "routing_policy",
                        header: "Routing policy",
                        cell: (item) => item.routing_policy,
                        sortingField: "routing_policy",
                      },
                      {
                        id: "differentiator",
                        header: "Differentiator",
                        cell: () => "-",
                      },
                      {
                        id: "alias",
                        header: "Alias",
                        cell: () => "No",
                      },
                      {
                        id: "values",
                        header: "Value/Route traffic to",
                        cell: (item) => (
                          <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "12px" }}>
                            {item.values}
                          </div>
                        ),
                      },
                      {
                        id: "ttl",
                        header: "TTL (seconds)",
                        cell: (item) => item.ttl,
                        sortingField: "ttl",
                      },
                      {
                        id: "health_check_id",
                        header: "Health check ID",
                        cell: () => "-",
                      },
                      {
                        id: "evaluate_target_health",
                        header: "Evaluate target health",
                        cell: () => "-",
                      },
                      {
                        id: "record_id",
                        header: "Record ID",
                        cell: (item) => item.id,
                      },
                    ]}
                    items={items}
                    loading={loading}
                    loadingText="Loading records..."
                    selectionType="multi"
                    selectedItems={selectedItems}
                    onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
                    filter={
                      <SpaceBetween direction="horizontal" size="s">
                        <TextFilter
                          {...filterProps}
                          filteringPlaceholder="Filter records by property or value"
                          countText={`${filteredItemsCount} match${filteredItemsCount === 1 ? "" : "es"}`}
                        />
                        <div style={{ minWidth: "150px" }}>
                          <Select
                            selectedOption={typeFilter}
                            onChange={(e) => setTypeFilter(e.detail.selectedOption)}
                            options={[
                              { label: "All record types", value: "" },
                              ...RECORD_TYPES,
                            ]}
                            placeholder="Filter by type"
                          />
                        </div>
                      </SpaceBetween>
                    }
                    pagination={<Pagination {...paginationProps} />}
                  />
                ),
              },
              {
                id: "accelerated_recovery",
                label: "Accelerated recovery",
                content: (
                  <Box padding={{ vertical: "l" }} textAlign="center" color="text-status-inactive">
                    Route 53 Application Recovery Controller is not configured for this hosted zone.
                  </Box>
                ),
              },
              {
                id: "dnssec",
                label: "DNSSEC signing",
                content: (
                  <Box padding={{ vertical: "l" }} textAlign="center" color="text-status-inactive">
                    DNSSEC signing is currently not configured for this hosted zone.
                  </Box>
                ),
              },
              {
                id: "tags",
                label: "Hosted zone tags (0)",
                content: (
                  <Box padding={{ vertical: "l" }} textAlign="center" color="text-status-inactive">
                    No tags associated with this resource.
                  </Box>
                ),
              },
            ]}
          />
        </SpaceBetween>
      }
    >
      <Modal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        header="Create record"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isCreatingRecord}
                onClick={handleCreateRecord}
              >
                Create records
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label={
              <span>
                Record name <Link variant="info">Info</Link>
              </span>
            }
            description="Keep blank to create a record for the root domain."
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Input
                value={recordNamePrefix}
                onChange={(e) => setRecordNamePrefix(e.detail.value)}
                placeholder="subdomain"
              />
              <span style={{ color: "#545b64", fontWeight: 600 }}>.{zone?.name ? zone.name.replace(/\.$/, "") : ""}</span>
            </div>
          </FormField>

          <FormField
            label={
              <span>
                Record type <Link variant="info">Info</Link>
              </span>
            }
          >
            <Select
              selectedOption={selectedType}
              onChange={(e) => setSelectedType(e.detail.selectedOption)}
              options={RECORD_TYPES}
            />
          </FormField>

          <FormField
            label="Alias"
            description="Route traffic to AWS resources or another Route 53 record"
          >
            <Toggle checked={isAlias} onChange={(e) => setIsAlias(e.detail.checked)}>
              {isAlias ? "Yes" : "No"}
            </Toggle>
          </FormField>

          <FormField
            label={
              <span>
                Value <Link variant="info">Info</Link>
              </span>
            }
            description="Enter multiple values on separate lines."
          >
            <Textarea
              value={recordValues}
              onChange={(e) => setRecordValues(e.detail.value)}
              placeholder="192.0.2.1"
              rows={4}
            />
          </FormField>

          <FormField
            label={
              <span>
                TTL (seconds) <Link variant="info">Info</Link>
              </span>
            }
            description="Recommended values: 60 to 172800 (two days)"
          >
            <SpaceBetween direction="horizontal" size="xs">
              <div style={{ width: "160px" }}>
                <Input
                  value={recordTtl}
                  type="number"
                  onChange={(e) => setRecordTtl(e.detail.value)}
                  placeholder="300"
                />
              </div>
              <Button onClick={() => setRecordTtl("60")}>1m</Button>
              <Button onClick={() => setRecordTtl("3600")}>1h</Button>
              <Button onClick={() => setRecordTtl("86400")}>1d</Button>
            </SpaceBetween>
          </FormField>

          <FormField
            label={
              <span>
                Routing policy <Link variant="info">Info</Link>
              </span>
            }
          >
            <Select
              selectedOption={{ label: "Simple routing", value: "Simple" }}
              onChange={() => {}}
              options={[
                { label: "Simple routing", value: "Simple" },
                { label: "Weighted routing", value: "Weighted" },
                { label: "Geolocation routing", value: "Geolocation" },
                { label: "Latency routing", value: "Latency" },
                { label: "Failover routing", value: "Failover" },
              ]}
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        header={`Edit record - ${selectedItems[0]?.name}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isEditingRecord}
                onClick={handleEditRecord}
              >
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Value / Route traffic to">
            <Textarea
              value={editRecordValues}
              onChange={(e) => setEditRecordValues(e.detail.value)}
              rows={4}
            />
          </FormField>
          <FormField label="TTL (seconds)">
            <Input
              value={editRecordTtl}
              type="number"
              onChange={(e) => setEditRecordTtl(e.detail.value)}
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Delete DNS record(s)"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isDeleting}
                onClick={handleDeleteRecords}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box variant="p">
          Are you sure you want to delete <b>{selectedItems.length}</b> DNS record(s)?
        </Box>
      </Modal>

      <Modal
        visible={exportModalVisible}
        onDismiss={() => setExportModalVisible(false)}
        header={`Export BIND Zone File - ${zone?.name}`}
        size="large"
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => {
                navigator.clipboard.writeText(exportedBindText);
                alert("Copied to clipboard");
              }}
            >
              Copy to clipboard
            </Button>
          </Box>
        }
      >
        <Textarea value={exportedBindText} readOnly rows={12} />
      </Modal>

      <Modal
        visible={importModalVisible}
        onDismiss={() => setImportModalVisible(false)}
        header="Import DNS records from BIND zone file"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setImportModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isImporting}
                onClick={handleImportBind}
              >
                Import records
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p">
            Paste BIND zone file contents below:
          </Box>
          <Textarea
            value={bindText}
            onChange={(e) => setBindText(e.detail.value)}
            placeholder={`mail.example.com. 300 IN A 192.0.2.10\nwww.example.com. 300 IN CNAME example.com.`}
            rows={10}
          />
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteZoneModalVisible}
        onDismiss={() => setDeleteZoneModalVisible(false)}
        header={`Delete hosted zone ${zone?.name.replace(/\.$/, "")}?`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteZoneModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isDeletingZone}
                disabled={deleteZoneConfirm.toLowerCase() !== "delete"}
                onClick={handleDeleteZone}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p">
            Are you sure you want to delete hosted zone <b>{zone?.name}</b> ({zone?.id})? All associated DNS records will be permanently removed.
          </Box>
          <FormField label="To confirm deletion, type 'delete' below:">
            <Input
              value={deleteZoneConfirm}
              onChange={(e) => setDeleteZoneConfirm(e.detail.value)}
              placeholder="delete"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={editZoneModalVisible}
        onDismiss={() => setEditZoneModalVisible(false)}
        header="Edit hosted zone"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditZoneModalVisible(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={isEditingZone} onClick={handleUpdateZone}>
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Description" constraintText={`The description can have up to 256 characters. ${editZoneDesc.length}/256`}>
          <Textarea
            value={editZoneDesc}
            onChange={(e) => setEditZoneDesc(e.detail.value.slice(0, 256))}
            rows={3}
          />
        </FormField>
      </Modal>
    </ConsoleShell>
  );
}
