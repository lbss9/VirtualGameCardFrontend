import { getPlatform, type PlatformId } from "../../../shared/catalog/platforms";

interface Props {
  amount: number;
  platform?: PlatformId | string;
  /** Código a exibir na face do cartão (mascarado ou não). */
  code?: string;
  /** Cartão pequeno (lista) ou grande (destaque). */
  size?: "md" | "lg";
  /** Anima flutuando (usado no destaque da loja). */
  floating?: boolean;
}

/** Cartão de gift card estilizado, 100% CSS, reutilizado na loja e nas compras. */
export default function GiftCardVisual({
  amount,
  platform = "steam",
  code,
  size = "lg",
  floating = false,
}: Props) {
  const selectedPlatform = getPlatform(platform);

  return (
    <div
      className={`gift-card gc-front gc-${size} ${floating ? "gc-floating" : "gc-static"}`}
      data-platform={selectedPlatform.id}
    >
      <span className="gc-ambient" aria-hidden="true" />
      <div className="gc-top">
        <span className="gc-brand"><i className="platform-mark"><img src={selectedPlatform.logo} alt="" /></i> {selectedPlatform.shortName}</span>
        <span className="gc-chip" />
      </div>
      <span className="gc-value big" key={amount}>
        R$ {amount}
      </span>
      <div className="gc-bottom">
        <span className="gc-code">{code ?? "•••• •••• ••••"}</span>
        <span className="gc-tag">{selectedPlatform.shortName.toUpperCase()}</span>
      </div>
      <div className="gc-shine" />
    </div>
  );
}
