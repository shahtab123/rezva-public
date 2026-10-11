import Link from "next/link";
import {
  compatibleWalletStatusLabel,
  compatibleWallets,
} from "./compatible-wallets";

type CompatibleWalletsListProps = {
  compact?: boolean;
};

export function CompatibleWalletsList({
  compact = false,
}: CompatibleWalletsListProps) {
  if (!compatibleWallets.length) {
    return (
      <div className={compact ? "docs-wallets docs-wallets-compact" : "docs-wallets"}>
        <div className="docs-wallets-header">
          <p className="docs-wallets-title">Test wallets</p>
          {!compact ? (
            <p className="docs-wallets-lede">
              Approved production wallets appear here once operator review is
              complete. Until then, use the open-source Mobile wallet and Rabby
              (Chrome) reference clients under{" "}
              <Link href="/docs/reference/compatible-wallets">
                Compatible wallets
              </Link>{" "}
              to test resolve.
            </p>
          ) : null}
        </div>
        <div className="docs-wallets-empty">
          <p>No production wallets listed yet.</p>
          {!compact ? (
            <Link className="docs-wallets-link" href="/integrate">
              Request integration
            </Link>
          ) : (
            <Link className="docs-wallets-link" href="/docs/reference/compatible-wallets">
              Learn more
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "docs-wallets docs-wallets-compact" : "docs-wallets"}>
      <div className="docs-wallets-header">
        <p className="docs-wallets-title">Test wallets</p>
        {!compact ? (
          <p className="docs-wallets-lede">
            Clone the Mobile wallet or Rabby (Chrome) reference client to test
            identifier resolve and Base Sepolia payments with a Free API key.
          </p>
        ) : null}
      </div>
      <ul className="docs-wallets-list">
        {compatibleWallets.map((wallet) => {
          const content = (
            <>
              <span className="docs-wallet-mark" aria-hidden="true">
                {wallet.name.slice(0, 1)}
              </span>
              <span className="docs-wallet-copy">
                <strong>{wallet.name}</strong>
                <small>
                  {wallet.blurb
                    ? wallet.blurb
                    : wallet.resolver && wallet.merchantSetup
                      ? "Resolver + setup"
                      : "Resolver only"}
                </small>
              </span>
              <span
                className={`docs-wallet-status docs-wallet-status-${wallet.status}`}
              >
                {compatibleWalletStatusLabel[wallet.status]}
              </span>
            </>
          );

          return (
            <li key={wallet.id}>
              <a href={wallet.href} target="_blank" rel="noreferrer">
                {content}
              </a>
            </li>
          );
        })}
      </ul>
      {compact ? (
        <Link className="docs-wallets-footlink" href="/docs/reference/compatible-wallets">
          View all
        </Link>
      ) : null}
    </div>
  );
}
