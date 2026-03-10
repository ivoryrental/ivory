export type SupportedLocale = "en" | "ka" | "ru";

export interface SettingsValue {
    [key: string]: unknown;
}

export interface LocalizedValue {
    en: string;
    ka: string;
    ru: string;
}

// Default values to fallback if DB is empty
export const DEFAULT_SETTINGS = {
    contact: {
        phone: "550 001 701",
        address: {
            en: "Tbilisi, Georgia",
            ka: "თბილისი, საქართველო",
            ru: "Тбилиси, Грузия",
        },
        email: "info@ivory.ge",
    },
    social: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
    },
    hero: {
        title: {
            en: "IVORY",
            ka: "IVORY",
            ru: "IVORY",
        },
        subtitle: {
            en: "Inventory Rental Shop",
            ka: "Inventory Rental Shop",
            ru: "Inventory Rental Shop",
        },
        text: {
            en: "Turn your event into an unforgettable memory. We offer exceptional inventory and design.",
            ka: "აქციეთ თქვენი ღონისძიება დაუვიწყარ მოგონებად. ჩვენ გთავაზობთ გამორჩეულ ინვენტარს და დიზაინს.",
            ru: "Превратите ваше мероприятие в незабываемое воспоминание. Мы предлагаем исключительный инвентарь и дизайн.",
        },
    },
    about: {
        text: {
            en: "IVORY is a premier inventory rental service based in Tbilisi, Georgia. Since 2024, we have been helping our clients transform their events into unforgettable experiences.",
            ka: "IVORY არის ინვენტარის გაქირავების პრემიუმ სერვისი თბილისში. 2024 წლიდან ჩვენ ვეხმარებით მომხმარებლებს აქციონ თავიანთი ღონისძიებები დაუვიწყარ მოგონებად.",
            ru: "IVORY — это премиальный сервис аренды инвентаря в Тбилиси. С 2024 года мы помогаем нашим клиентам превращать их мероприятия в незабываемые события.",
        }
    },
    policies: {
        privacy: {
            en: "",
            ka: "",
            ru: "",
        },
        terms: {
            en: "",
            ka: "",
            ru: "",
        }
    }
};
