import "./ListRow.css";

// One row of a <ul>: title and optional note on the left, children (buttons, fields) on the right
export const ListRow = ({ title, note, children }) => (
  <li className="list-row">
    <div>
      <div className="list-row-title">{title}</div>
      {note && <div className="list-row-note">{note}</div>}
    </div>
    {children && <div className="list-row-actions">{children}</div>}
  </li>
);
