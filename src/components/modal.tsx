"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, trigger, children }: { title: string; trigger: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <span onClick={() => ref.current?.showModal()}>{trigger}</span>
      <dialog ref={ref} className="modal" onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" type="button" aria-label="Close" onClick={() => ref.current?.close()}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </dialog>
    </>
  );
}
