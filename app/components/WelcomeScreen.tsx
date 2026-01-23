"use client";

import { Button } from "@blueshift-gg/ui-components";
import { useProjectStore } from "../stores/store";
import AsciiAnimation from "./Ascii";

export const WelcomeScreen = () => {
  const { createNewProject, setIsSidebarOpen } = useProjectStore();

  const handleImportFromWelcome = () => {
    setIsSidebarOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-128px)]">
      <div className="w-full max-w-[550px] mx-auto bg-card-solid/50 border border-border-light flex flex-col text-center">
        <div className="w-full h-[250px] border-b bg-brand-primary/2 border-border flex items-center justify-center overflow-hidden relative">
          <AsciiAnimation
            textPath="ascii"
            color="brand"
          />
        </div>
        <div className="flex flex-col gap-y-4 px-5 py-8">
          <h1
            className="text-2xl font-bold text-shade-primary"
          >
            sbpf.xyz
          </h1>
          <p
            className="mx-auto text-shade-secondary leading-[160%]"
          >
            Calculate memory offsets for Solana accounts in your programs. Add
            accounts, configure their types and data lengths, and get precise
            offset calculations for ASM, Rust, and C.
          </p>
        </div>
        <div className="mt-auto flex gap-x-4 justify-center bg-card-solid p-3 border-t border-t-border">
          <Button
            onClick={createNewProject}
            size="lg"
            variant="primary"
            icon={{ name: "Add" }}
            label="New Project"
            className="w-full"
          />
          <Button
            onClick={handleImportFromWelcome}
            size="lg"
            variant="secondary"
            icon={{ name: "Upload" }}
            label="Import Project"
            className="w-full"
          />
        </div>
      </div>
      </div>
  );
};
