function headerValue(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

function safeAddress(value: string) {
  const address = headerValue(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    throw new Error("Invalid email destination");
  }
  return address;
}

export function createTextEmail(fromInput: string, toInput: string, subject: string, body: string) {
  const to = safeAddress(toInput);
  const from = safeAddress(fromInput);
  return {
    from: { email: from, name: "Eikon Mind" },
    to,
    subject: headerValue(subject),
    text: body,
  };
}
