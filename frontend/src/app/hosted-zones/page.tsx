"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import { FlashbarProps } from "@cloudscape-design/components/flashbar";
import { useCollection } from "@cloudscape-design/collection-hooks";
import ConsoleShell from "@/components/ConsoleShell";
import { api, HostedZone } from "@/lib/api";

export default function HostedZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [flashItems, setFlashItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await api.getHostedZones();
      setZones(data);
    } catch (err: any) {
      setFlashItems([
        {
          type: "error",
          content: err.message || "Failed to load hosted zones.",
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    zones,
    {
      filtering: {
        empty: "No hosted zones found",
        noMatch: "No matches found",
        filteringFunction: (item, text) => {
          const lower = text.toLowerCase();
          return (
            item.name.toLowerCase().includes(lower) ||
            item.id.toLowerCase().includes(lower) ||
            (item.description && item.description.toLowerCase().includes(lower))
          );
        },
      },
      pagination: { pageSize: 10 },
      sorting: { defaultState: { sortingColumn: { sortingField: "name" }, isDescending: false } },
      selection: {},
    }
  );

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      setIsDeleting(true);
      const target = selectedItems[0];
      await api.deleteHostedZone(target.id);
      setFlashItems([
        {
          type: "success",
          content: `Deleted hosted zone ${target.name}`,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setSelectedItems([]);
      setDeleteModalVisible(false);
      setDeleteConfirmInput("");
      fetchZones();
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
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (selectedItems.length === 0) return;
    try {
      setIsEditing(true);
      const target = selectedItems[0];
      await api.updateHostedZone(target.id, { description: editDescription });
      setFlashItems([
        {
          type: "success",
          content: `Updated hosted zone ${target.name}`,
          dismissible: true,
          onDismiss: () => setFlashItems([]),
        },
      ]);
      setEditModalVisible(false);
      fetchZones();
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
      setIsEditing(false);
    }
  };

  return (
    <ConsoleShell
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: "Route 53", href: "/hosted-zones" },
            { text: "Hosted zones", href: "/hosted-zones" },
          ]}
        />
      }
      flashItems={flashItems}
      content={
        <SpaceBetween size="m">
          <Table
            {...collectionProps}
            header={
              <Header
                variant="awsui-h1-sticky"
                counter={`(${zones.length})`}
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button iconName="refresh" onClick={fetchZones} ariaLabel="Refresh" />
                    <Button
                      disabled={selectedItems.length !== 1}
                      onClick={() => router.push(`/hosted-zones/${selectedItems[0].id}`)}
                    >
                      View details
                    </Button>
                    <Button
                      disabled={selectedItems.length !== 1}
                      onClick={() => {
                        setEditDescription(selectedItems[0].description || "");
                        setEditModalVisible(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      disabled={selectedItems.length !== 1}
                      onClick={() => {
                        setDeleteConfirmInput("");
                        setDeleteModalVisible(true);
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => router.push("/hosted-zones/create")}
                    >
                      Create hosted zone
                    </Button>
                  </SpaceBetween>
                }
              >
                Hosted zones
              </Header>
            }
            columnDefinitions={[
              {
                id: "name",
                header: "Hosted zone name",
                cell: (item) => (
                  <Link
                    href={`/hosted-zones/${item.id}`}
                    style={{ color: "#0073bb", textDecoration: "none", fontWeight: 600 }}
                  >
                    {item.name.replace(/\.$/, "")}
                  </Link>
                ),
                sortingField: "name",
              },
              {
                id: "type",
                header: "Type",
                cell: (item) => item.type || "Public",
                sortingField: "type",
              },
              {
                id: "created_by",
                header: "Created by",
                cell: () => "-",
              },
              {
                id: "record_count",
                header: "Record count",
                cell: (item) => item.record_count,
                sortingField: "record_count",
              },
              {
                id: "description",
                header: "Description",
                cell: (item) => item.description || "-",
                sortingField: "description",
              },
              {
                id: "id",
                header: "Hosted zone ID",
                cell: (item) => item.id,
                sortingField: "id",
              },
            ]}
            items={items}
            loading={loading}
            loadingText="Loading hosted zones..."
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.detail.selectedItems)}
            filter={
              <div>
                <Box variant="p" color="text-status-inactive" padding={{ bottom: "xs" }}>
                  Automatic mode is the current search behavior optimized for best filter results. To change modes go to settings.
                </Box>
                <TextFilter
                  {...filterProps}
                  filteringPlaceholder="Filter records by property or value"
                  countText={`${filteredItemsCount} match${filteredItemsCount === 1 ? "" : "es"}`}
                />
              </div>
            }
            pagination={<Pagination {...paginationProps} />}
            empty={
              <Box textAlign="center" color="inherit" padding={{ vertical: "l" }}>
                <b>No hosted zones</b>
                <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                  There are no hosted zones created for this account.
                </Box>
                <Button variant="primary" onClick={() => router.push("/hosted-zones/create")}>
                  Create hosted zone
                </Button>
              </Box>
            }
          />
        </SpaceBetween>
      }
    >
      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Delete hosted zone"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isDeleting}
                disabled={deleteConfirmInput.toLowerCase() !== "delete"}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p">
            Permanently delete <b>{selectedItems[0]?.name}</b> ({selectedItems[0]?.id})? All DNS records within this hosted zone will also be deleted.
          </Box>
          <FormField label="To confirm deletion, type 'delete' below:">
            <Input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.detail.value)}
              placeholder="delete"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        header={`Edit hosted zone - ${selectedItems[0]?.name}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={isEditing} onClick={handleEdit}>
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Description">
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.detail.value)}
            placeholder="Add comments or description"
          />
        </FormField>
      </Modal>
    </ConsoleShell>
  );
}
