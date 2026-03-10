"use client";

import { useState } from "react";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useFormStatus } from "react-dom";
import { saveSettingsAction } from "@/app/actions/settings";
import { updateAdminAction } from "@/app/actions/auth";
import { cn, getLocalized } from "@/lib/utils";
import { ImageInput } from "./ImageInput";
import { useTranslations, useLocale } from "next-intl";
import { LocalizedValue } from "@/lib/settings-shared";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocalizedNativeValidation } from "@/lib/native-validation";

interface SecurityFormProps {
    t: ReturnType<typeof useTranslations<"adminSettings">>;
}

function SecurityForm({ t }: SecurityFormProps) {
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);
    const [msg, setMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function handleSecurityUpdate(formData: FormData) {
        const res = await updateAdminAction(formData);
        setMsg(res.message);
        setTimeout(() => setMsg(""), 3000);
    }

    return (
        <form
            action={handleSecurityUpdate}
            onInvalid={handleInvalid}
            onInput={clearValidationMessage}
            onChange={clearValidationMessage}
            className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6 max-w-md"
        >
            <h3 className="text-lg font-bold border-b pb-2">{t('tabs.security')}</h3>
            <div className="grid gap-2">
                <label className="text-sm font-medium">{t('labels.username')}</label>
                <input name="username" type="text" required className="w-full px-4 py-2 rounded-md border border-input bg-background" placeholder="admin" />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">{t('labels.password')}</label>
                <div className="relative">
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full px-4 py-2 pr-10 rounded-md border border-input bg-background"
                        placeholder="••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div className="pt-4">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md font-bold hover:bg-primary/90 transition-all">
                    {t('saveChanges')}
                </button>
                {msg && <p className="mt-2 text-sm font-medium text-green-600">{msg}</p>}
            </div>
        </form>
    );
}


interface PopularCategorySlot {
    slug: string;
    image: string;
}

interface Category {
    id: string;
    name: string;
    name_ka?: string | null;
    name_ru?: string | null;
    slug: string;
    image?: string | null;
}

interface HeroSettings {
    mainImage?: string;
    secondaryImage?: string;
    title?: LocalizedValue;
    text?: LocalizedValue;
}

interface ContactSettings {
    phone?: string;
    email?: string;
    address?: LocalizedValue;
}

interface SocialSettings {
    facebook?: string;
    instagram?: string;
}

interface AboutSettings {
    text?: LocalizedValue;
}

interface PoliciesSettings {
    privacy?: LocalizedValue;
    terms?: LocalizedValue;
}

interface PopularCategoriesSettings {
    config?: PopularCategorySlot[] | string;
}

interface AppSettings {
    hero?: HeroSettings;
    contact?: ContactSettings;
    social?: SocialSettings;
    about?: AboutSettings;
    policies?: PoliciesSettings;
    popularCategories?: PopularCategoriesSettings;
}

interface SettingsFormProps {
    initialSettings: AppSettings;
    categories: Category[];
}

function SubmitButton() {
    const { pending } = useFormStatus();
    const t = useTranslations("adminSettings");
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-md font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
            {pending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {t('saveChanges')}
        </button>
    );
}

export function SettingsForm({ initialSettings, categories }: SettingsFormProps) {
    const t = useTranslations("adminSettings");
    const locale = useLocale();
    const { handleInvalid, clearValidationMessage } = useLocalizedNativeValidation(locale);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = searchParams.get("tab") || "general";
    const [message, setMessage] = useState("");

    const setActiveTab = (tabId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Hero Image States
    const [heroMainImage, setHeroMainImage] = useState(initialSettings.hero?.mainImage || "");
    const [heroSecondaryImage, setHeroSecondaryImage] = useState(initialSettings.hero?.secondaryImage || "");

    // Popular Categories State
    const [popularCategories, setPopularCategories] = useState<PopularCategorySlot[]>(() => {
        try {
            return initialSettings.popularCategories?.config
                ? typeof initialSettings.popularCategories.config === 'string'
                    ? JSON.parse(initialSettings.popularCategories.config)
                    : initialSettings.popularCategories.config
                : [{}, {}, {}, {}];
        } catch {
            return [{}, {}, {}, {}];
        }
    });

    const tabs = [
        { id: "general", label: t('tabs.general') },
        { id: "hero", label: t('tabs.hero') },
        { id: "categories", label: t('tabs.categories') },
        { id: "about", label: t('tabs.about') },
        { id: "social", label: t('tabs.social') },
        { id: "policies", label: t('tabs.policies') },
        { id: "security", label: t('tabs.security') },
    ];

    async function clientAction(formData: FormData) {
        const res = await saveSettingsAction(formData);
        if (res?.success) {
            setMessage(t('successMessage'));
            setTimeout(() => setMessage(""), 3000);
        }
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 border-b-2 transition-colors font-medium",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab !== "security" && (
                <form
                    action={clientAction}
                    onInvalid={handleInvalid}
                    onInput={clearValidationMessage}
                    onChange={clearValidationMessage}
                    className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6"
                >

                    {/* General & Contact Tab */}
                    <div className={cn("space-y-4", activeTab !== "general" && "hidden")}>
                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.contactInfo')}</h3>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">{t('labels.phoneNumber')}</label>
                            <input
                                name="contact.phone"
                                defaultValue={initialSettings.contact?.phone}
                                className="w-full px-4 py-2 rounded-md border border-input bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">{t('labels.email')}</label>
                            <input
                                name="contact.email"
                                defaultValue={initialSettings.contact?.email}
                                className="w-full px-4 py-2 rounded-md border border-input bg-background"
                            />
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 mt-6">{t('sections.address')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.en')}</label>
                                <input name="contact.address.en" defaultValue={initialSettings.contact?.address?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ka')}</label>
                                <input name="contact.address.ka" defaultValue={initialSettings.contact?.address?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ru')}</label>
                                <input name="contact.address.ru" defaultValue={initialSettings.contact?.address?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                        </div>
                    </div>

                    {/* Social Media Tab */}
                    <div className={cn("space-y-4", activeTab !== "social" && "hidden")}>
                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.socialLinks')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.facebookUrl')}</label>
                                <input
                                    name="social.facebook"
                                    defaultValue={initialSettings.social?.facebook}
                                    placeholder="https://facebook.com/your-page"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.instagramUrl')}</label>
                                <input
                                    name="social.instagram"
                                    defaultValue={initialSettings.social?.instagram}
                                    placeholder="https://instagram.com/your-profile"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hero Tab */}
                    <div className={cn("space-y-4", activeTab !== "hero" && "hidden")}>
                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.heroImages')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <ImageInput
                                    label={t('labels.mainBgImage')}
                                    value={heroMainImage}
                                    onChange={setHeroMainImage}
                                />
                                <input type="hidden" name="hero.mainImage" value={heroMainImage} />
                            </div>
                            <div>
                                <ImageInput
                                    label={t('labels.secondaryImage')}
                                    value={heroSecondaryImage}
                                    onChange={setHeroSecondaryImage}
                                />
                                <input type="hidden" name="hero.secondaryImage" value={heroSecondaryImage} />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.mainTitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.en')}</label>
                                <input name="hero.title.en" defaultValue={initialSettings.hero?.title?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ka')}</label>
                                <input name="hero.title.ka" defaultValue={initialSettings.hero?.title?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ru')}</label>
                                <input name="hero.title.ru" defaultValue={initialSettings.hero?.title?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 mt-6">{t('sections.subtitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.en')}</label>
                                <textarea rows={3} name="hero.text.en" defaultValue={initialSettings.hero?.text?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ka')}</label>
                                <textarea rows={3} name="hero.text.ka" defaultValue={initialSettings.hero?.text?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ru')}</label>
                                <textarea rows={3} name="hero.text.ru" defaultValue={initialSettings.hero?.text?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                        </div>
                    </div>

                    {/* Popular Categories Tab */}
                    <div className={cn("space-y-4", activeTab !== "categories" && "hidden")}>
                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.popularCategories')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('popularCategoriesDesc')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[0, 1, 2, 3].map((index) => (
                                <div key={index} className="p-4 border rounded-lg bg-background">
                                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded mb-2 inline-block">{t('labels.slot')} {index + 1}</span>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium block mb-1">{t('labels.category')}</label>
                                            <select
                                                value={popularCategories[index]?.slug || ""}
                                                onChange={(e) => {
                                                    const newCats = [...popularCategories];
                                                    if (!newCats[index]) newCats[index] = { slug: "", image: "" };
                                                    newCats[index].slug = e.target.value;
                                                    setPopularCategories(newCats);
                                                }}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="">{t('labels.category')}</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.slug}>{getLocalized(c, 'name', locale)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <ImageInput
                                            label={t('labels.customImage')}
                                            value={popularCategories[index]?.image || ""}
                                            onChange={(url) => {
                                                const newCats = [...popularCategories];
                                                if (!newCats[index]) newCats[index] = { slug: "", image: "" };
                                                newCats[index].image = url;
                                                setPopularCategories(newCats);
                                            }}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <input type="hidden" name="popularCategories.config" value={JSON.stringify(popularCategories)} />
                    </div>

                    {/* About Us Tab */}
                    <div className={cn("space-y-4", activeTab !== "about" && "hidden")}>
                        <h3 className="text-lg font-bold border-b pb-2">{t('sections.aboutUsText')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.en')}</label>
                                <textarea rows={6} name="about.text.en" defaultValue={initialSettings.about?.text?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ka')}</label>
                                <textarea rows={6} name="about.text.ka" defaultValue={initialSettings.about?.text?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('labels.ru')}</label>
                                <textarea rows={6} name="about.text.ru" defaultValue={initialSettings.about?.text?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                            </div>
                        </div>
                    </div>

                    {/* Policies Tab */}
                    <div className={cn("space-y-6", activeTab !== "policies" && "hidden")}>
                        <div>
                            <h3 className="text-lg font-bold border-b pb-2 mb-4">{t('sections.privacyPolicy')}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.en')}</label>
                                    <textarea rows={8} name="policies.privacy.en" defaultValue={initialSettings.policies?.privacy?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.ka')}</label>
                                    <textarea rows={8} name="policies.privacy.ka" defaultValue={initialSettings.policies?.privacy?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.ru')}</label>
                                    <textarea rows={8} name="policies.privacy.ru" defaultValue={initialSettings.policies?.privacy?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold border-b pb-2 mb-4 mt-6">{t('sections.termsConditions')}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.en')}</label>
                                    <textarea rows={8} name="policies.terms.en" defaultValue={initialSettings.policies?.terms?.en} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.ka')}</label>
                                    <textarea rows={8} name="policies.terms.ka" defaultValue={initialSettings.policies?.terms?.ka} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('labels.ru')}</label>
                                    <textarea rows={8} name="policies.terms.ru" defaultValue={initialSettings.policies?.terms?.ru} className="w-full px-4 py-2 rounded-md border border-input bg-background" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border mt-6">
                        <SubmitButton />
                        {message && <p className="text-green-600 font-medium animate-pulse">{message}</p>}
                    </div>
                </form>
            )}

            {/* Security Tab (Separate Form) */}
            {activeTab === "security" && (
                <SecurityForm t={t} />
            )}

        </div>
    );
}
