import { useEffect } from "react";
import { formatSlot } from "../../api";
import { Button } from "../Button/Button";
import "./ThankYou.css";

const CLOSE_SECONDS = 6;
const PIECES = ["pizza", "tomato", "salami", "mozzarella"];
const PIECES_PER_BURST = 12;

// Where each firework explodes, in percent of the screen, and when
const BURSTS = [
  { left: 22, top: 28, delay: 0 },
  { left: 78, top: 24, delay: 0.5 },
  { left: 50, top: 18, delay: 1 },
  { left: 18, top: 72, delay: 1.5 },
  { left: 82, top: 70, delay: 2 },
];

const formatPrice = (value) =>
  value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

// Shown after an order is sent; goes back to an empty menu by itself
export const ThankYou = ({ order, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, CLOSE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="thank-you" role="dialog" aria-live="polite">
      <div className="thank-you-fireworks" aria-hidden="true">
        {BURSTS.map((burst, burstIndex) => (
          <div
            key={burstIndex}
            className="thank-you-burst"
            style={{ left: `${burst.left}%`, top: `${burst.top}%` }}
          >
            {Array.from({ length: PIECES_PER_BURST }, (_, index) => {
              const angle = (index / PIECES_PER_BURST) * 2 * Math.PI;
              const distance = 110 + (index % 3) * 25;
              return (
                <div
                  key={index}
                  className={`thank-you-piece thank-you-${
                    PIECES[(index + burstIndex) % PIECES.length]
                  }`}
                  style={{
                    "--x": `${Math.round(Math.cos(angle) * distance)}px`,
                    "--y": `${Math.round(Math.sin(angle) * distance)}px`,
                    "--turn": `${(index % 2 ? 1 : -1) * (120 + index * 15)}deg`,
                    "--delay": `${burst.delay}s`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="thank-you-card">
        <div className="thank-you-title">Grazie per l'ordine!</div>
        <div className="thank-you-number">Ordine n. {order.id} inviato</div>
        <div className="thank-you-detail">
          {order.orderType}
          {order.tableNumber
            ? ` - Tavolo ${order.tableNumber}`
            : ` - ${order.customerName}`}
          {order.scheduledAt && ` - ore ${formatSlot(order.scheduledAt)}`}
        </div>
        <div className="thank-you-total">Totale {formatPrice(order.total)}</div>
        <Button className="thank-you-button" onClick={onClose}>
          Nuovo ordine
        </Button>
        <div className="thank-you-timer">
          <div
            className="thank-you-timer-bar"
            style={{ animationDuration: `${CLOSE_SECONDS}s` }}
          />
        </div>
      </div>
    </div>
  );
};
