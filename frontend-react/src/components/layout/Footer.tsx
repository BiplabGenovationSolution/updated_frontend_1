

import { useState } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { SecurityDialog } from './SecurityDialog';

export const Footer = () => {
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);

  return (
    <>
      {/* Footer — in-flow, sits below scrollable content */}
      <div className="w-full px-10 py-2 flex justify-end items-center gap-6 flex-shrink-0">

        {/* Version */}
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Beta v0.9 · Sovereign Instance
        </span>

        {/* Security Button */}
        {/* <div
          onClick={() => setIsSecurityDialogOpen(true)}
          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:opacity-80 transition"
        >
          <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
          <Zap className="h-3 w-3 text-purple-500/80 dark:text-purple-400" />
          <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 tracking-wide">
            PQ-E2EE
          </span>
        </div> */}


        <div
          onClick={() => setIsSecurityDialogOpen(true)}
          className="
            flex items-center gap-1
            px-2 py-[2px]
            rounded
            cursor-pointer
            bg-teal-50
            dark:bg-teal-500/10
            border border-teal-200
            dark:border-teal-500/20
            hover:bg-teal-100
            dark:hover:bg-teal-500/20
            transition-all duration-200
          "
        >
          <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />

          <Zap className="h-2.5 w-2.5 text-purple-500 dark:text-purple-400" />

          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 tracking-wide">
            PQ-E2EE
          </span>
        </div>




      </div>

      {/* Security Dialog */}
      <SecurityDialog
        isOpen={isSecurityDialogOpen}
        onClose={() => setIsSecurityDialogOpen(false)}
      />
    </>
  );
};