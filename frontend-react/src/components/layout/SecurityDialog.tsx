


// frontend/src/components/layout/SecurityDialog.tsx
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Shield,
    Sparkles,
    Zap,
    CheckCircle2,
    Database,
    Lock,
    Server,
    Eye,
    XCircle,
    ShieldCheck,
} from "lucide-react"

interface SecurityDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function SecurityDialog({ isOpen, onClose }: SecurityDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-full p-8 gap-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] shadow-xl text-[10px]">
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                        Data Protection & Security
                    </DialogTitle>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Your data is encrypted at rest and protected from unauthorized access.
                    </p>
                </DialogHeader>

                {/* Post-Quantum Banner */}
                {/* <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-full shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Post-Quantum Encryption
                            <span className="font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full border border-white/30 text-white leading-none flex items-center h-5">
                                Future-Proof
                            </span>
                        </h3>
                    </div>
                    <p className="text-white/90 mb-4 leading-tight">
                        Your data is protected with <strong className="font-bold text-white">next-generation cryptography</strong> that's secure even against quantum computers. We use <strong className="font-bold text-white">Kyber768</strong> and <strong className="font-bold text-white">Dilithium3</strong> algorithms, ensuring your privacy for decades to come.
                    </p>
                    <div className="flex items-center gap-2 font-medium text-white/90">
                        <Zap className="w-4 h-4 shrink-0" />
                        Protected against future quantum computing threats
                    </div>
                </div> */}
                <div className="bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 from-violet-600 to-blue-600 rounded-xl p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 dark:bg-white/20 rounded-full shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Post-Quantum Encryption
                            <span className="font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full border border-white/30 text-white leading-none flex items-center h-5">
                                Future-Proof
                            </span>
                        </h3>
                    </div>
                    <p className="text-white/90 mb-4 leading-tight">
                        Your data is protected with <strong className="font-bold text-white">next-generation cryptography</strong> that's secure even against quantum computers. We use <strong className="font-bold text-white">Kyber768</strong> and <strong className="font-bold text-white">Dilithium3</strong> algorithms, ensuring your privacy for decades to come.
                    </p>
                    <div className="flex items-center gap-2 font-medium text-white/90">
                        <Zap className="w-4 h-4 shrink-0" />
                        Protected against future quantum computing threats
                    </div>
                </div>


                {/* E2E Active Banner */}
                <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/5 dark:border-emerald-500/20 rounded-xl p-4 flex gap-3 shadow-sm">
                    <div className="mt-0.5 shrink-0">
                        <div className="bg-emerald-100 dark:bg-emerald-500/20 rounded-full p-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-[12px]">Enterprise End-to-End Encryption Active</h4>
                        <p className="text-emerald-700/80 dark:text-emerald-500/80 mt-1">Your data is encrypted using organizational master keys with post-quantum algorithms. Only your organization can decrypt it.</p>
                    </div>
                </div>

                {/* How Your Data Is Protected */}
                <div>
                    <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-900 dark:text-white text-sm mt-2">
                        <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                        How Your Data Is Protected
                    </h3>

                    <div className="space-y-3">
                        <div className="flex gap-4 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl shadow-sm bg-white dark:bg-[#161b22]">
                            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white text-[12px]">Encrypted Storage</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-tight">All data is encrypted before being saved to the database using AES-256-GCM (military-grade encryption).</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>

                        <div className="flex gap-4 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl shadow-sm bg-white dark:bg-[#161b22]">
                            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white text-[12px]">Secure Processing</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-tight">Data is only decrypted in memory for AI processing, then immediately re-encrypted before storage.</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>

                        <div className="flex gap-4 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl shadow-sm bg-white dark:bg-[#161b22]">
                            <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white text-[12px]">Vendor-Proof Protection</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-tight">Cloud providers and vendors cannot access your data. Only your organization holds the encryption keys.</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>

                        <div className="flex gap-4 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl shadow-sm bg-white dark:bg-[#161b22]">
                            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white text-[12px]">Compliance & Legal Access</h4>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-tight">Your organization can decrypt data for legal compliance, eDiscovery, and data retention requirements.</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>
                    </div>
                </div>

                {/* What's Protected */}
                <div>
                    <h3 className="font-bold mb-4 text-slate-900 dark:text-white text-sm mt-2">What's Protected</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 px-1">
                        {['Message Content', 'File Attachments', 'Chat History', 'User Data', 'AI Responses', 'Documents'].map(item => (
                            <div key={item} className="flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Technical Details */}
                <div>
                    <h3 className="font-bold mb-4 text-slate-900 dark:text-white text-sm mt-2">Technical Details</h3>
                    <div className="border border-violet-100 dark:border-violet-500/20 rounded-xl overflow-hidden shadow-sm">
                        {/* PQ Crypto details header */}
                        <div className="border-l-[3px] border-l-violet-500 bg-violet-50/80 dark:bg-violet-500/5 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="flex items-center gap-2 font-bold text-violet-900 dark:text-violet-300 text-[12px]">
                                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    Post-Quantum Cryptography
                                </h4>
                                <span className="bg-violet-600 text-white px-2.5 py-1 rounded-full font-bold tracking-wide">Next-Gen Security</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-violet-100/80 dark:border-violet-500/10 pb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Key Exchange:</span>
                                    <span className="font-medium text-violet-700 dark:text-violet-400">Kyber768 (NIST PQC Standard)</span>
                                </div>
                                <div className="flex justify-between items-center pb-1">
                                    <span className="text-slate-600 dark:text-slate-400">Digital Signatures:</span>
                                    <span className="font-medium text-violet-700 dark:text-violet-400">Dilithium3 (NIST PQC Standard)</span>
                                </div>
                            </div>
                            <p className="italic text-violet-600/80 dark:text-violet-400/80 mt-3 pt-3 border-t border-violet-100/80 dark:border-violet-500/10">Quantum computers cannot break this encryption, even in the future.</p>
                        </div>

                        {/* Standard crypto details */}
                        <div className="bg-white dark:bg-[#161b22] px-5 py-4 space-y-3.5">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">Symmetric Encryption:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-200">AES-256-GCM (Military-Grade)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">Key Derivation:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-200">HKDF with Hierarchical Key Manager</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">Key Storage:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-200">Organizational Master Key (32 bytes)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">Threat Model:</span>
                                <span className="font-medium text-slate-900 dark:text-slate-200">Protects from cloud/vendor access</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Who Can Access Your Data */}
                <div>
                    <h3 className="font-bold mb-4 text-slate-900 dark:text-white text-sm mt-2">Who Can Access Your Data</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#161b22] shadow-sm">
                            <div className="flex gap-3 items-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white text-[12px]">You & Your Team</div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">Full access to encrypted and decrypted data</div>
                                </div>
                            </div>
                            <div className="bg-[#111827] dark:bg-slate-800 text-white px-3 py-1.5 rounded-full font-bold tracking-wide">Can Access</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#161b22] shadow-sm">
                            <div className="flex gap-3 items-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white text-[12px]">Your Organization</div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">Can decrypt for compliance, legal hold, eDiscovery</div>
                                </div>
                            </div>
                            <div className="bg-[#111827] dark:bg-slate-800 text-white px-3 py-1.5 rounded-full font-bold tracking-wide">Can Access</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#161b22] shadow-sm">
                            <div className="flex gap-3 items-center">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white text-[12px]">Cloud Provider (MongoDB Atlas)</div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">Cannot decrypt data (no encryption keys)</div>
                                </div>
                            </div>
                            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full font-bold tracking-wide">No Access</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#161b22] shadow-sm">
                            <div className="flex gap-3 items-center">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white text-[12px]">Hosting Vendor</div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">Cannot decrypt data (no encryption keys)</div>
                                </div>
                            </div>
                            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full font-bold tracking-wide">No Access</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#161b22] shadow-sm">
                            <div className="flex gap-3 items-center">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white text-[12px]">Third Parties</div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">No access whatsoever</div>
                                </div>
                            </div>
                            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full font-bold tracking-wide">No Access</div>
                        </div>
                    </div>
                </div>

                {/* Commitment Box */}
                <div className="border border-blue-200 dark:border-blue-500/30 rounded-xl overflow-hidden mt-6 mb-2 shadow-sm">
                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-6">
                        <h4 className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 mb-3 text-sm">
                            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Our Privacy & Security Commitment
                        </h4>
                        <p className="text-blue-800/90 dark:text-blue-200/90 leading-tight mb-5">
                            We built Mentis Extended with privacy as a core principle, not an afterthought. Your data belongs to you and your organization. We use <strong className="text-blue-900 dark:text-blue-300 font-bold">next-generation post-quantum cryptography</strong> alongside industry-leading encryption to ensure that cloud providers, hosting vendors, and third parties can never access your sensitive information — <strong className="text-blue-900 dark:text-blue-300 font-bold">not today, not tomorrow, and not even when quantum computers become mainstream.</strong>
                        </p>

                        <div className="bg-violet-100/80 dark:bg-violet-900/40 rounded-lg p-4 text-violet-900 dark:text-violet-200 flex gap-3">
                            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                            <p className="leading-tight">
                                <strong className="font-bold">Future-proof security:</strong> While most companies are just starting to think about quantum threats, we've already implemented NIST-standardized post-quantum algorithms to protect your data for decades to come.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
