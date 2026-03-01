import React from "react";

export function ModeChooser({
  onAdd,
  onUpdate,
}: {
  onAdd: () => void;
  onUpdate: () => void;
}) {
  return (
    <div className="mode-chooser">
      <button className="mode-option" onClick={onAdd}>
        <div className="mode-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 0.25C8.48325 0.25 8.875 0.641751 8.875 1.125V7.125H14.875C15.3582 7.125 15.75 7.51675 15.75 8C15.75 8.48325 15.3582 8.875 14.875 8.875H8.875V14.875C8.875 15.3582 8.48325 15.75 8 15.75C7.51675 15.75 7.125 15.3582 7.125 14.875V8.875H1.125C0.641751 8.875 0.25 8.48325 0.25 8C0.25 7.51675 0.641751 7.125 1.125 7.125H7.125V1.125C7.125 0.641751 7.51675 0.25 8 0.25Z" fill="currentColor"/>
          </svg>
        </div>
        <span className="mode-label">Add new</span>
        <span className="mode-desc">Submit a new pattern to the library</span>
      </button>
      <button className="mode-option" onClick={onUpdate}>
        <div className="mode-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 7.99998C2 4.48578 4.86555 2.25 7.75 2.25C10.1525 2.25 12.2688 3.82694 12.8454 6.5H9C8.51675 6.5 8.125 6.89175 8.125 7.375C8.125 7.85825 8.51675 8.25 9 8.25H14.875C15.3582 8.25 15.75 7.85825 15.75 7.375V1.5C15.75 1.01675 15.3582 0.625 14.875 0.625C14.3917 0.625 14 1.01675 14 1.5V4.49666C12.8213 1.99425 10.3953 0.5 7.75 0.5C4.03357 0.5 0.25 3.39003 0.25 7.99998C0.25 12.6099 4.03357 15.45 7.75 15.45C9.72936 15.45 11.6059 14.7166 13.0362 13.2862C13.3779 12.9445 13.3779 12.3905 13.0362 12.0488C12.6945 11.7071 12.1405 11.7071 11.7988 12.0488C10.7004 13.1472 9.27063 13.75 7.75 13.75C4.86555 13.75 2 11.5142 2 7.99998Z" fill="currentColor"/>
          </svg>
        </div>
        <span className="mode-label">Update existing</span>
        <span className="mode-desc">Add a new version to an existing pattern</span>
      </button>
    </div>
  );
}
