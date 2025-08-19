"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { resetPasswordWithSeed } from "@/lib/userUtils";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [seedWords, setSeedWords] = useState<string[]>(["", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSeedWordsSubmit = () => {
        if (!seedWords[0] || !seedWords[1] || !seedWords[2]) {
            toast.error("Please enter all three seed words");
            return;
        }
        setStep(2);
    };

    const handlePasswordReset = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);

        try {
            await resetPasswordWithSeed(newPassword, seedWords);
            toast.success("Password reset successfully!");
            router.push("/");
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error(error instanceof Error ? error.message : "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6">
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="absolute top-6 left-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Button>
                    
                    <h1 className="text-3xl font-bold">Reset Password</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {step === 1 
                            ? "Enter your seed phrase words to verify your identity" 
                            : "Create a new password for your account"
                        }
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                    🔐 Seed Phrase Verification
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Please enter the 4th, 6th, and 8th words from your 12-word seed phrase.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="word4">4th word</Label>
                                    <Input
                                        id="word4"
                                        value={seedWords[0]}
                                        onChange={(e) => setSeedWords([e.target.value, seedWords[1], seedWords[2]])}
                                        placeholder="Enter the 4th word"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="word6">6th word</Label>
                                    <Input
                                        id="word6"
                                        value={seedWords[1]}
                                        onChange={(e) => setSeedWords([seedWords[0], e.target.value, seedWords[2]])}
                                        placeholder="Enter the 6th word"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="word8">8th word</Label>
                                    <Input
                                        id="word8"
                                        value={seedWords[2]}
                                        onChange={(e) => setSeedWords([seedWords[0], seedWords[1], e.target.value])}
                                        placeholder="Enter the 8th word"
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={handleSeedWordsSubmit}
                                className="w-full"
                                disabled={!seedWords[0] || !seedWords[1] || !seedWords[2]}
                            >
                                Verify Seed Phrase
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                    ✅ Identity Verified
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Seed phrase verified successfully. Now create a new password.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={handlePasswordReset}
                                className="w-full"
                                disabled={!newPassword || !confirmPassword || isLoading}
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
