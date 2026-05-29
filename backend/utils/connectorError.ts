/**
 * ConnectorNotConfiguredError
 *
 * Thrown when a backend service attempts to use a third-party integration
 * (Twilio, Meta, Razorpay, SMTP, etc.) but the tenant has not configured
 * the required connector credentials in Settings → Connectors.
 *
 * Controllers should catch this error and return a structured 422 response
 * so the frontend can render a user-friendly "Please set up X integration" prompt.
 */
export class ConnectorNotConfiguredError extends Error {
  public readonly connector: string;
  public readonly code = 'CONNECTOR_NOT_CONFIGURED';

  constructor(connector: string, detail?: string) {
    const message =
      detail ||
      `Please configure your ${connector} integration in Settings → Connectors before using this feature.`;
    super(message);
    this.name = 'ConnectorNotConfiguredError';
    this.connector = connector;
    Object.setPrototypeOf(this, ConnectorNotConfiguredError.prototype);
  }
}
