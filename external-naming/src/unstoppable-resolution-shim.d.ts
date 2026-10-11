declare module "@unstoppabledomains/resolution" {
  export class Resolution {
    constructor(options?: {
      sourceConfig?: {
        uns?: {
          locations?: {
            Layer1?: { url: string; network: string };
            Layer2?: { url: string; network: string };
          };
        };
      };
    });
    addr(domain: string, currency: string): Promise<string>;
    isRegistered(domain: string): Promise<boolean>;
  }
}
