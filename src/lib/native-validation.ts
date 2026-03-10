import type { FormEventHandler } from "react";

type SupportedValidationLocale = "en" | "ka" | "ru";
type FormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type TextLengthElement = HTMLInputElement | HTMLTextAreaElement;

type ValidationMessages = {
    required: string;
    email: string;
    url: string;
    number: string;
    tooShort: string;
    tooLong: string;
    rangeUnderflow: string;
    rangeOverflow: string;
    patternMismatch: string;
    invalid: string;
};

const VALIDATION_MESSAGES: Record<SupportedValidationLocale, ValidationMessages> = {
    en: {
        required: "Please fill out this field.",
        email: "Please enter a valid email address.",
        url: "Please enter a valid URL.",
        number: "Please enter a number.",
        tooShort: "Please lengthen this text to at least {minLength} characters.",
        tooLong: "Please shorten this text to no more than {maxLength} characters.",
        rangeUnderflow: "Please select a value that is no less than {min}.",
        rangeOverflow: "Please select a value that is no greater than {max}.",
        patternMismatch: "Please match the requested format.",
        invalid: "Please enter a valid value.",
    },
    ka: {
        required: "გთხოვთ, შეავსოთ ეს ველი.",
        email: "გთხოვთ, მიუთითოთ ელფოსტის სწორი მისამართი.",
        url: "გთხოვთ, მიუთითოთ სწორი URL.",
        number: "გთხოვთ, მიუთითოთ რიცხვი.",
        tooShort: "გთხოვთ, შეიყვანოთ მინიმუმ {minLength} სიმბოლო.",
        tooLong: "გთხოვთ, შეიყვანოთ მაქსიმუმ {maxLength} სიმბოლო.",
        rangeUnderflow: "გთხოვთ, მიუთითოთ მნიშვნელობა, რომელიც არ არის {min}-ზე ნაკლები.",
        rangeOverflow: "გთხოვთ, მიუთითოთ მნიშვნელობა, რომელიც არ არის {max}-ზე მეტი.",
        patternMismatch: "გთხოვთ, დაიცვათ მოთხოვნილი ფორმატი.",
        invalid: "გთხოვთ, შეიყვანოთ სწორი მნიშვნელობა.",
    },
    ru: {
        required: "Пожалуйста, заполните это поле.",
        email: "Пожалуйста, введите корректный адрес электронной почты.",
        url: "Пожалуйста, введите корректный URL.",
        number: "Пожалуйста, введите число.",
        tooShort: "Пожалуйста, введите не менее {minLength} символов.",
        tooLong: "Пожалуйста, введите не более {maxLength} символов.",
        rangeUnderflow: "Пожалуйста, укажите значение не меньше {min}.",
        rangeOverflow: "Пожалуйста, укажите значение не больше {max}.",
        patternMismatch: "Пожалуйста, соблюдайте требуемый формат.",
        invalid: "Пожалуйста, введите корректное значение.",
    },
};

function normalizeLocale(locale: string): SupportedValidationLocale {
    if (locale.startsWith("ka")) return "ka";
    if (locale.startsWith("ru")) return "ru";
    return "en";
}

function isFormControlElement(target: EventTarget | null): target is FormControlElement {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    );
}

function isTextLengthElement(element: FormControlElement): element is TextLengthElement {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
}

function formatMessage(template: string, params: Record<string, string | number>): string {
    return Object.entries(params).reduce((message, [key, value]) => {
        return message.replace(`{${key}}`, String(value));
    }, template);
}

function getLocalizedValidationMessage(
    element: FormControlElement,
    locale: SupportedValidationLocale
): string {
    const validity = element.validity;
    const messages = VALIDATION_MESSAGES[locale];

    if (validity.valueMissing) return messages.required;
    if (validity.typeMismatch) {
        if (element instanceof HTMLInputElement && element.type === "email") return messages.email;
        if (element instanceof HTMLInputElement && element.type === "url") return messages.url;
        return messages.invalid;
    }
    if (validity.badInput) {
        if (element instanceof HTMLInputElement && element.type === "number") return messages.number;
        return messages.invalid;
    }
    if (validity.tooShort) {
        if (isTextLengthElement(element)) {
            return formatMessage(messages.tooShort, { minLength: element.minLength });
        }
        return messages.invalid;
    }
    if (validity.tooLong) {
        if (isTextLengthElement(element)) {
            return formatMessage(messages.tooLong, { maxLength: element.maxLength });
        }
        return messages.invalid;
    }
    if (validity.rangeUnderflow) {
        return formatMessage(messages.rangeUnderflow, { min: (element as HTMLInputElement).min || 0 });
    }
    if (validity.rangeOverflow) {
        return formatMessage(messages.rangeOverflow, { max: (element as HTMLInputElement).max || 0 });
    }
    if (validity.patternMismatch) return messages.patternMismatch;

    return messages.invalid;
}

export function useLocalizedNativeValidation(locale: string) {
    const normalizedLocale = normalizeLocale(locale);

    const handleInvalid: FormEventHandler<HTMLFormElement> = (event) => {
        if (!isFormControlElement(event.target)) return;
        event.target.setCustomValidity(getLocalizedValidationMessage(event.target, normalizedLocale));
    };

    const clearValidationMessage: FormEventHandler<HTMLFormElement> = (event) => {
        if (!isFormControlElement(event.target)) return;
        event.target.setCustomValidity("");
    };

    return { handleInvalid, clearValidationMessage };
}
