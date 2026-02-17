import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Wizard
        "wizard.title": "3 Steps Measurement Wizard",

        // Step 1
        "step1.title": "Tell us about you",
        "step1.name": "Name *",
        "step1.namePlaceholder": "John Smith",
        "step1.nameError": "Name must be at least 2 characters",
        "step1.email": "Email *",
        "step1.emailPlaceholder": "john@example.com",
        "step1.emailError": "Enter a valid email (e.g. name@example.com)",
        "step1.phone": "Phone",
        "step1.phonePlaceholder": "5551234567",
        "step1.phoneError": "Phone must be exactly 10 digits",
        "step1.postal": "Postal/ZIP *",
        "step1.postalPlaceholder": "12345 or H4W2H8",
        "step1.postalError": "Enter a valid US or Canadian postal code",

        // Step 2
        "step2.title": "Add your spaces",
        "step2.subtitle": "CLOSETS / KITCHEN / GARAGE",
        "step2.units": "Units",
        "step2.addSpace": "Add space",
        "step2.noSpaces": "No spaces yet. Click",
        "step2.toBegin": "to begin.",
        "step2.spaceDetails": "Space details",
        "step2.spaceName": "Space name *",
        "step2.ceilingHeight": "Ceiling height",
        "step2.activeSpace": "Active space",
        "step2.deleteSpace": "Delete this space",
        "step2.photosTitle": "Photos & videos (optional)",
        "step2.photosDesc": "Photos and videos are optional, but the more info you share, the lower the chance of misfit or design errors.",
        "step2.uploadClick": "Click to upload files",
        "step2.uploadSize": "Images and videos up to 20MB",
        "step2.filesSelected": "file(s) selected",
        "step2.storagePriorities": "Storage priorities",
        "step2.storageTap": "Tap in order of most needed.",
        "step2.hanging": "Hanging",
        "step2.drawers": "Drawers",
        "step2.shelves": "Shelves",
        "step2.additionalNotes": "Additional notes (optional)",
        "step2.notesPlaceholder": "Any special requirements or preferences...",
        "step2.drawingCompleted": "Drawing completed",
        "step2.noDrawing": "No drawing yet",
        "step2.addAtLeastOne": "Please add at least one space",
        "step2.enterName": "Please enter a name for",
        "step2.enterCeiling": "Please enter ceiling height for",
        "step2.fillWalls": "Please fill all wall measurements for",

        // Step 3
        "step3.title": "Schedule Your Free Consultation",
        "step3.subtitle": "Book a convenient time for your design consultation below.",
        "step3.meetingTitle": "Choose Your Meeting Time",
        "step3.meetingScheduled": "Meeting Scheduled Successfully!",
        "step3.meetingDesc": "Your consultation has been booked. You can now submit your design request.",
        "step3.reschedule": "Reschedule Meeting",
        "step3.loadingCalendar": "Loading calendar...",
        "step3.scheduleBefore": "Please schedule a meeting above before submitting your request.",
        "step3.summaryTitle": "Submission Summary",
        "step3.summaryDesc": "Review your details. You can edit any field before submitting.",
        "step3.field": "Field",
        "step3.value": "Value",
        "step3.fullName": "Full Name",
        "step3.email": "Email",
        "step3.phone": "Phone",
        "step3.postalCode": "Postal Code",
        "step3.spaces": "Spaces",
        "step3.spaceDetails": "Space Details",
        "step3.spaceDrawing": "Space Drawing",
        "step3.wallMeasurements": "Wall Measurements",
        "step3.wall": "Wall",
        "step3.totalPerimeter": "Total Perimeter",
        "step3.estimatedArea": "Estimated Area",
        "step3.storagePriorities": "Storage Priorities",
        "step3.files": "Files",
        "step3.notes": "Notes",
        "step3.none": "None",
        "step3.filesUploaded": "file(s) uploaded",
        "step3.spaceCount": "space(s)",
        "step3.submitRequest": "Submit Request",
        "step3.submitting": "Submitting...",
        "step3.changesSaved": "Changes saved",
        "step3.scheduleMeetingFirst": "Please schedule a meeting before submitting",
        "step3.submissionComplete": "Submission complete! Check your email for confirmation.",
        "step3.submissionFailed": "Submission failed. Please try again.",
        "step3.emailFailed": "Submission saved, but email failed to send.",
        "step3.meetingScheduledToast": "Meeting scheduled successfully!",

        // Drawing Canvas
        "canvas.title": "Draw your space layout",
        "canvas.subtitle": "Draw walls BIRDS EYE VIEW or use ROOM TEMPLATES below",
        "canvas.lShape": "L-Shape",
        "canvas.angle": "Angle",
        "canvas.undo": "Undo",
        "canvas.clear": "Clear",
        "canvas.wallsDrawn": "Walls drawn",
        "canvas.drawingMode": "Drawing mode - Click and drag to draw walls",
        "canvas.enterWallLengths": "Enter wall lengths",
        "canvas.totalPerimeter": "Total Perimeter",
        "canvas.estimatedArea": "Estimated Area",
        "canvas.maxWalls": "Maximum {max} walls allowed per space",
        "canvas.nothingToUndo": "Nothing to undo!",
        "canvas.canvasCleared": "Canvas cleared!",
        "canvas.undoSuccess": "Undo successful!",
        "canvas.templateAdded": "template with {count} wall(s) added!",

        // Navigation
        "nav.next": "Next",
        "nav.back": "Back",
    },
    fr: {
        // Wizard
        "wizard.title": "Planificateur Espace 3 Étapes™",

        // Step 1
        "step1.title": "Parlez-nous de vous",
        "step1.name": "Nom *",
        "step1.namePlaceholder": "Jean Dupont",
        "step1.nameError": "Le nom doit contenir au moins 2 caractères",
        "step1.email": "Courriel *",
        "step1.emailPlaceholder": "jean@exemple.com",
        "step1.emailError": "Entrez un courriel valide (ex. nom@exemple.com)",
        "step1.phone": "Téléphone",
        "step1.phonePlaceholder": "5551234567",
        "step1.phoneError": "Le téléphone doit contenir exactement 10 chiffres",
        "step1.postal": "Code postal *",
        "step1.postalPlaceholder": "12345 ou H4W2H8",
        "step1.postalError": "Entrez un code postal canadien ou américain valide",

        // Step 2
        "step2.title": "Ajoutez vos espaces",
        "step2.subtitle": "GARDE-ROBES / CUISINE / GARAGE",
        "step2.units": "Unités",
        "step2.addSpace": "Ajouter un espace",
        "step2.noSpaces": "Aucun espace. Cliquez sur",
        "step2.toBegin": "pour commencer.",
        "step2.spaceDetails": "Détails de l'espace",
        "step2.spaceName": "Nom de l'espace *",
        "step2.ceilingHeight": "Hauteur du plafond",
        "step2.activeSpace": "Espace actif",
        "step2.deleteSpace": "Supprimer cet espace",
        "step2.photosTitle": "Photos et vidéos (optionnel)",
        "step2.photosDesc": "Les photos et vidéos sont optionnelles, mais plus vous partagez d'informations, moins il y a de risques d'erreurs de conception.",
        "step2.uploadClick": "Cliquez pour téléverser des fichiers",
        "step2.uploadSize": "Images et vidéos jusqu'à 20 Mo",
        "step2.filesSelected": "fichier(s) sélectionné(s)",
        "step2.storagePriorities": "Priorités de rangement",
        "step2.storageTap": "Appuyez dans l'ordre de priorité.",
        "step2.hanging": "Penderie",
        "step2.drawers": "Tiroirs",
        "step2.shelves": "Étagères",
        "step2.additionalNotes": "Notes supplémentaires (optionnel)",
        "step2.notesPlaceholder": "Exigences ou préférences particulières...",
        "step2.drawingCompleted": "Dessin complété",
        "step2.noDrawing": "Aucun dessin",
        "step2.addAtLeastOne": "Veuillez ajouter au moins un espace",
        "step2.enterName": "Veuillez entrer un nom pour",
        "step2.enterCeiling": "Veuillez entrer la hauteur du plafond pour",
        "step2.fillWalls": "Veuillez remplir toutes les mesures des murs pour",

        // Step 3
        "step3.title": "Planifiez votre consultation gratuite",
        "step3.subtitle": "Réservez un moment convenable pour votre consultation de design ci-dessous.",
        "step3.meetingTitle": "Choisissez l'heure de votre rencontre",
        "step3.meetingScheduled": "Rencontre planifiée avec succès !",
        "step3.meetingDesc": "Votre consultation a été réservée. Vous pouvez maintenant soumettre votre demande.",
        "step3.reschedule": "Replanifier la rencontre",
        "step3.loadingCalendar": "Chargement du calendrier...",
        "step3.scheduleBefore": "Veuillez planifier une rencontre ci-dessus avant de soumettre votre demande.",
        "step3.summaryTitle": "Résumé de la soumission",
        "step3.summaryDesc": "Révisez vos informations. Vous pouvez modifier tout champ avant de soumettre.",
        "step3.field": "Champ",
        "step3.value": "Valeur",
        "step3.fullName": "Nom complet",
        "step3.email": "Courriel",
        "step3.phone": "Téléphone",
        "step3.postalCode": "Code postal",
        "step3.spaces": "Espaces",
        "step3.spaceDetails": "Détails des espaces",
        "step3.spaceDrawing": "Dessin de l'espace",
        "step3.wallMeasurements": "Mesures des murs",
        "step3.wall": "Mur",
        "step3.totalPerimeter": "Périmètre total",
        "step3.estimatedArea": "Surface estimée",
        "step3.storagePriorities": "Priorités de rangement",
        "step3.files": "Fichiers",
        "step3.notes": "Notes",
        "step3.none": "Aucune",
        "step3.filesUploaded": "fichier(s) téléversé(s)",
        "step3.spaceCount": "espace(s)",
        "step3.submitRequest": "Soumettre la demande",
        "step3.submitting": "Soumission en cours...",
        "step3.changesSaved": "Modifications enregistrées",
        "step3.scheduleMeetingFirst": "Veuillez planifier une rencontre avant de soumettre",
        "step3.submissionComplete": "Soumission complète ! Vérifiez votre courriel pour la confirmation.",
        "step3.submissionFailed": "Échec de la soumission. Veuillez réessayer.",
        "step3.emailFailed": "Soumission enregistrée, mais l'envoi du courriel a échoué.",
        "step3.meetingScheduledToast": "Rencontre planifiée avec succès !",

        // Drawing Canvas
        "canvas.title": "Dessinez le plan de votre espace",
        "canvas.subtitle": "Dessinez les murs en VUE AÉRIENNE ou utilisez les MODÈLES ci-dessous",
        "canvas.lShape": "Forme en L",
        "canvas.angle": "Angle",
        "canvas.undo": "Annuler",
        "canvas.clear": "Effacer",
        "canvas.wallsDrawn": "Murs dessinés",
        "canvas.drawingMode": "Mode dessin - Cliquez et glissez pour dessiner les murs",
        "canvas.enterWallLengths": "Entrez les longueurs des murs",
        "canvas.totalPerimeter": "Périmètre total",
        "canvas.estimatedArea": "Surface estimée",
        "canvas.maxWalls": "Maximum {max} murs autorisés par espace",
        "canvas.nothingToUndo": "Rien à annuler !",
        "canvas.canvasCleared": "Canevas effacé !",
        "canvas.undoSuccess": "Annulation réussie !",
        "canvas.templateAdded": "modèle avec {count} mur(s) ajouté !",

        // Navigation
        "nav.next": "Suivant",
        "nav.back": "Retour",
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem("wizardLanguage");
        return (saved === "fr" ? "fr" : "en") as Language;
    });

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("wizardLanguage", lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within LanguageProvider");
    return context;
};
