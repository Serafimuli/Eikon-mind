const apiOrigin = "https://app.terraform.io";
const variableKey = "CLOUDFLARE_API_TOKEN";

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const organization = requiredEnvironment("TF_CLOUD_ORGANIZATION");
const workspaceName = requiredEnvironment("HCP_TERRAFORM_WORKSPACE");
const workingDirectory = requiredEnvironment("HCP_TERRAFORM_WORKING_DIRECTORY");
const hcpToken = requiredEnvironment("HCP_TERRAFORM_TOKEN");
const cloudflareToken = requiredEnvironment("CLOUDFLARE_PROVIDER_TOKEN");

if (
  workingDirectory.startsWith("/") ||
  workingDirectory.includes("\\") ||
  workingDirectory.split("/").some((segment) => !segment || segment === "." || segment === "..")
) {
  throw new Error("HCP_TERRAFORM_WORKING_DIRECTORY must be a safe relative path");
}

async function hcpRequest(path, init = {}) {
  const response = await fetch(new URL(path, apiOrigin), {
    ...init,
    headers: {
      authorization: `Bearer ${hcpToken}`,
      "content-type": "application/vnd.api+json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HCP Terraform API request failed with HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

const workspace = await hcpRequest(
  `/api/v2/organizations/${encodeURIComponent(organization)}/workspaces/${encodeURIComponent(workspaceName)}`,
);
const workspaceId = workspace?.data?.id;
if (!workspaceId) throw new Error(`HCP workspace ${workspaceName} was not found`);

const executionMode = workspace.data.attributes?.["execution-mode"];
if (executionMode !== "remote") {
  throw new Error(`Expected HCP workspace remote execution, received ${executionMode}`);
}

if (workspace.data.attributes?.["working-directory"] !== workingDirectory) {
  await hcpRequest(`/api/v2/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        id: workspaceId,
        type: "workspaces",
        attributes: { "working-directory": workingDirectory },
      },
    }),
  });
}

const variables = [];
let next = `/api/v2/workspaces/${encodeURIComponent(workspaceId)}/vars`;
while (next) {
  const page = await hcpRequest(next);
  variables.push(...(page?.data ?? []));
  next = page?.links?.next ?? null;
}

const matchingVariables = variables.filter(({ attributes }) => attributes?.key === variableKey);
if (matchingVariables.length > 1) {
  throw new Error(`HCP workspace has duplicate ${variableKey} variables`);
}
if (matchingVariables[0] && matchingVariables[0].attributes.category !== "env") {
  throw new Error(`${variableKey} must be an HCP workspace environment variable`);
}

const attributes = {
  key: variableKey,
  value: cloudflareToken,
  description: `Cloudflare provider credential for remote ${workspaceName} Terraform runs`,
  category: "env",
  hcl: false,
  sensitive: true,
};
const existing = matchingVariables[0];
if (existing) {
  await hcpRequest(
    `/api/v2/workspaces/${encodeURIComponent(workspaceId)}/vars/${encodeURIComponent(existing.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ data: { id: existing.id, type: "vars", attributes } }),
    },
  );
} else {
  await hcpRequest(`/api/v2/workspaces/${encodeURIComponent(workspaceId)}/vars`, {
    method: "POST",
    body: JSON.stringify({ data: { type: "vars", attributes } }),
  });
}

console.log(`Configured ${workingDirectory} and sensitive ${variableKey} in ${workspaceName}`);
