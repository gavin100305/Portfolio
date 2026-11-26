import { AsciiDesk } from "./ascii-desk";

export function ArtworkFrame() {
  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage">
        <AsciiDesk />
      </div>
    </div>
  </figure>;
}
