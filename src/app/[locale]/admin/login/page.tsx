"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useLocalizedNativeValidation } from "@/lib/native-validation";

interface ActionState {
    message: string;
}

export default function LoginPage() {
    const router = useRouter();
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);

    async function handleLogin(prevState: ActionState, formData: FormData) {
        const success = await login(formData);
        if (success) {
            router.replace("/admin");
            return { message: "Success" };
        } else {
            return { message: "Invalid credentials" };
        }
    }

    const [state, formAction, isPending] = useActionState(handleLogin, { message: "" });

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-primary mb-2">IVORY Admin</h1>
                    <p className="text-muted-foreground">Please sign in to continue</p>
                </div>

                <form
                    action={formAction}
                    onInvalid={handleInvalid}
                    onInput={clearValidationMessage}
                    onChange={clearValidationMessage}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {state?.message && state.message !== "Success" && (
                        <div className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded">
                            {state.message}
                        </div>
                    )}

                    <button
                        disabled={isPending}
                        className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
