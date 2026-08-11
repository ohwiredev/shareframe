import type { ReactNode } from "react";


export type ViewMode = "raw" | "twitter" | "slack";

interface SocialPreviewWrapperProps {
  viewMode: ViewMode;
  children: ReactNode;
}

export function SocialPreviewWrapper({ viewMode, children }: SocialPreviewWrapperProps) {
  if (viewMode === "raw") {
    return <>{children}</>;
  }

  if (viewMode === "twitter") {
    return (
      <div className="mx-auto w-full max-w-[550px] font-sans">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="mb-3 flex flex-col gap-2">
          <div className="h-2 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
        
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#000000] transition-colors">
          <div className="[&_.functional-preview]:!border-0 [&_.functional-preview]:!rounded-none [&_.functional-preview]:!shadow-none [&_.functional-preview]:!bg-transparent">
            {children}
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <div className="h-2 w-16 bg-neutral-400 dark:bg-neutral-500 rounded mb-2" />
            <div className="h-3 w-48 bg-neutral-800 dark:bg-neutral-200 rounded mb-1" />
            <div className="h-2 w-full bg-neutral-400 dark:bg-neutral-500 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "slack") {
    return (
      <div className="mx-auto w-full max-w-[600px] font-sans">
        <div className="flex space-x-3 mb-1">
          <div className="w-9 h-9 rounded bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-3 w-24 bg-neutral-800 dark:bg-neutral-200 rounded" />
              <div className="h-2 w-12 bg-neutral-400 dark:bg-neutral-500 rounded" />
            </div>
            <div className="h-2 w-3/4 bg-neutral-800 dark:bg-neutral-200 rounded mb-3" />
            
            <div className="flex">
              <div className="w-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mr-3 shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-neutral-800 dark:bg-neutral-200 rounded mb-2" />
                <div className="h-2 w-64 bg-neutral-400 dark:bg-neutral-500 rounded mb-3" />
                <div className="rounded-lg overflow-hidden max-w-[400px] border border-neutral-200 dark:border-neutral-800">
                  <div className="[&_.functional-preview]:!border-0 [&_.functional-preview]:!rounded-none [&_.functional-preview]:!shadow-none [&_.functional-preview]:!bg-transparent">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
