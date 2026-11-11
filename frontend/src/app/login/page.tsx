"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Tabs from "@cloudscape-design/components/tabs";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signin");
  const [accountId, setAccountId] = useState("1234-5678-9012");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAccountId, setRegAccountId] = useState("9876-5432-1098");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      await api.login(username, password, accountId);
      router.push("/hosted-zones");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim()) {
      setErrorMsg("Username and password are required.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      await api.register(regUsername.trim(), regPassword.trim(), regAccountId.trim());
      setSuccessMsg(`User '${regUsername}' created successfully. You can now sign in.`);
      setUsername(regUsername);
      setPassword(regPassword);
      setAccountId(regAccountId);
      setActiveTab("signin");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f1b2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="#FF9900">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span style={{ color: "#ffffff", fontSize: "22px", fontWeight: 700 }}>
              Amazon Web Services
            </span>
          </div>
        </div>

        <Container
          header={
            <Header variant="h2" description="Access AWS Route 53 Console">
              AWS Management Console
            </Header>
          }
        >
          <SpaceBetween size="m">
            {errorMsg && <Alert type="error">{errorMsg}</Alert>}
            {successMsg && <Alert type="success">{successMsg}</Alert>}

            <Tabs
              activeTabId={activeTab}
              onChange={(e) => {
                setActiveTab(e.detail.activeTabId);
                setErrorMsg("");
              }}
              tabs={[
                {
                  id: "signin",
                  label: "Sign in",
                  content: (
                    <form onSubmit={handleLogin} style={{ marginTop: "16px" }}>
                      <SpaceBetween size="l">
                        <FormField label="Account ID" description="Enter any 12-digit AWS Account ID">
                          <Input
                            value={accountId}
                            onChange={(e) => setAccountId(e.detail.value)}
                            placeholder="1234-5678-9012"
                          />
                        </FormField>

                        <FormField label="IAM user name">
                          <Input
                            value={username}
                            onChange={(e) => setUsername(e.detail.value)}
                            placeholder="admin"
                          />
                        </FormField>

                        <FormField label="Password">
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.detail.value)}
                            placeholder="••••••••"
                          />
                        </FormField>

                        <Button variant="primary" loading={loading} formAction="submit">
                          Sign in
                        </Button>

                        <Box variant="small" color="text-status-inactive" textAlign="center">
                          Default accounts: <b>admin</b> / <b>admin123</b> or <b>developer</b> / <b>devpass123</b>
                        </Box>
                      </SpaceBetween>
                    </form>
                  ),
                },
                {
                  id: "register",
                  label: "Create new user",
                  content: (
                    <form onSubmit={handleRegister} style={{ marginTop: "16px" }}>
                      <SpaceBetween size="l">
                        <FormField label="Account ID" description="Assign a mock AWS Account ID">
                          <Input
                            value={regAccountId}
                            onChange={(e) => setRegAccountId(e.detail.value)}
                            placeholder="9876-5432-1098"
                          />
                        </FormField>

                        <FormField label="Username">
                          <Input
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.detail.value)}
                            placeholder="newuser"
                          />
                        </FormField>

                        <FormField label="Password">
                          <Input
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.detail.value)}
                            placeholder="••••••••"
                          />
                        </FormField>

                        <Button variant="primary" loading={loading} formAction="submit">
                          Create user & sign in
                        </Button>
                      </SpaceBetween>
                    </form>
                  ),
                },
              ]}
            />
          </SpaceBetween>
        </Container>
      </div>
    </div>
  );
}
