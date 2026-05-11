export type TranslationKeys = typeof en;

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  const result = { ...(base as Record<string, unknown>) };
  const overrideObj = override as Record<string, unknown>;
  for (const key of Object.keys(overrideObj)) {
    const val = overrideObj[key];
    const baseVal = (base as Record<string, unknown>)[key];
    if (val !== undefined && val !== null) {
      if (typeof val === "object" && !Array.isArray(val) && typeof baseVal === "object" && baseVal !== null && !Array.isArray(baseVal)) {
        result[key] = deepMerge(baseVal, val as DeepPartial<typeof baseVal>);
      } else {
        result[key] = val;
      }
    }
  }
  return result as unknown as T;
}

export const en = {
  tabs: {
    timeline: "Timeline",
    search: "Search",
    settings: "Settings",
    calendar: "Calendar",
  },
  common: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    generating: "Generating...",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    ok: "OK",
    share: "Share",
    tapForToday: "tap for today",
    newEntry: "NEW ENTRY",
    result: "result",
    results: "results",
    error: "Something went wrong. Please try again.",
    noEntriesYet: "No entries yet",
  },
  timeline: {
    emptyTitle: "No entries yet",
    emptySubtitle: "Your life proof lives here.\nTap + to save your first entry.",
    noTagEntries: "No {{tag}} entries yet.",
  },
  search: {
    title: "Search",
    placeholder: "Title, tag, or content...",
    noResults: "No results found",
    noResultsSub: "Try different keywords or filters",
    startSearching: "Start searching",
    startSearchingSub: "Search by title, tag, or content",
  },
  entryShare: {
    section: "SHARING & LINK",
    publicLink: "Public link",
    publicSub: "Anyone with the URL can view this entry in a browser once your Receipts backend serves `/p/{token}` and the posts API.",
    privateSub: "Only you see this entry. Shares use text only—no public page URL.",
    allowComments: "Allow comments",
    commentsSub: "Visitors can leave a comment on the public page using the same five emoji reactions.",
    regenerate: "New link",
    regenerateConfirmTitle: "Create a new link?",
    regenerateConfirmBody: "The previous URL will stop working for people you shared it with.",
    copyLink: "Copy link",
    copied: "Link copied to clipboard",
    noLinkBase: "Set EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_SHARE_WEB_ORIGIN in your environment to generate a share URL on native.",
    commentsSection: "COMMENTS",
    pullRemote: "Refresh comments",
    nameOptional: "Name (optional)",
    placeholder: "Write a comment…",
    post: "Post",
    remove: "Remove",
    emptyComments: "No comments yet.",
    postFailed: "Could not post. Check that your API implements POST /share/{token}/comments.",
    commentsNeedApi: "EXPO_PUBLIC_DOMAIN must point at your API host to load or post comments.",
  },
  add: {
    whatHappened: "What happened?",
    addDetails: "Add details...",
    listening: "Listening...",
    gallery: "Gallery",
    camera: "Camera",
    extractText: "Extract text",
    extractingText: "Reading text…",
    ocrUnavailable:
      "On-device text recognition needs the iOS/Android app build (not the web). If you use Expo Go, use a development or store build where the text module is included.",
    ocrNothingFound: "No text was found in this image.",
    ocrNoteTrimmed: "Your note was trimmed to fit the 2000 character limit.",
    ocrAppendTitle: "Add to note?",
    ocrAppendBody: "Append the detected text to this entry’s note?",
  },
  settings: {
    title: "Settings",
    sections: {
      security: "SECURITY",
      privacy: "PRIVACY",
      notifications: "NOTIFICATIONS",
      recurringPrompts: "RECURRING PROMPTS",
      appearance: "APPEARANCE",
      language: "LANGUAGE",
      social: "SOCIAL",
      backup: "BACKUP & RESTORE",
      danger: "DANGER ZONE",
    },
    rows: {
      appLock: "App Lock",
      biometric: "Biometric Unlock",
      autoLock: "Auto-Lock",
      decoyPin: "Decoy PIN",
      guestPass: "Guest Pass",
      localOnly: "Local Only Mode",
      screenshot: "Screenshot Protection",
      stripMetadata: "Strip Photo Metadata",
      dailyReminder: "Daily Reminder",
      theme: "Theme",
      fontColor: "Font Color",
      appLanguage: "App Language",
      currency: "Currency",
      export: "Export Backup",
      encryptedExport: "Encrypted Export",
      import: "Import Backup",
      generateCodes: "Generate Recovery Codes",
      backupPassphrase: "Backup Passphrase",
      wipeAll: "Wipe All Data",
      deleteAccount: "Delete Account",
      signOut: "Sign Out",
    },
    language: {
      title: "Language",
    },
    appearance: {
      theme: "Theme",
      dark: "Dark",
      light: "Light",
      system: "System",
    },
  },
  onboarding: {
    steps: [
      {
        title: "Your life is worth\ndocumenting.",
        body: "Every win, money move, memory, promise, and piece of proof — captured and organized, forever.",
        cta: "Let's go",
      },
      {
        title: "Five tags.\nEndless stories.",
        tags: {
          Win: "Victories worth remembering",
          Money: "Financial moves and decisions",
          Memory: "Moments of joy and connection",
          Promise: "Commitments you've made",
          Proof: "Evidence and receipts",
        },
        cta: "Sounds right",
      },
      {
        title: "Quick capture.\nRich details.",
        body: "Add photos as attachments, drop a pin, pick a mood, or attach a voice memo — all without sending your entries to a model in the cloud.",
        cta: "Got it",
      },
      {
        title: "Private by default.\nAlways.",
        body: "PIN lock, decoy mode, local-only option, and encrypted backups. Your entries never leave without your permission.",
        cta: "Start recording my life",
      },
    ],
  },
  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    guestPreview: "Continue as Guest",
    verifyEmail: "Check your email for a verification code.",
    verifyCode: "Verification code",
    verify: "Verify",
  },
};

export const es: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Cronología", search: "Buscar", settings: "Ajustes" },
  common: { cancel: "Cancelar", save: "Guardar", delete: "Eliminar", generating: "Generando...", today: "Hoy", yesterday: "Ayer", thisWeek: "Esta Semana", lastWeek: "Semana Pasada", ok: "OK", share: "Compartir", tapForToday: "toca para hoy", newEntry: "NUEVA ENTRADA", result: "resultado", results: "resultados", error: "Algo salió mal. Inténtalo de nuevo.", noEntriesYet: "Aún no hay entradas" },
  timeline: { emptyTitle: "Aún no hay entradas", emptySubtitle: "Aquí vive tu prueba de vida.\nToca + para guardar tu primera entrada.", noTagEntries: "Aún no hay entradas de {{tag}}." },
  search: { title: "Buscar", placeholder: "Título, etiqueta o contenido...", noResults: "Sin resultados", noResultsSub: "Intenta palabras clave o filtros diferentes", startSearching: "Comienza a buscar", startSearchingSub: "Busca por título, etiqueta o contenido" },
  add: { whatHappened: "¿Qué pasó?", addDetails: "Agregar detalles...", listening: "Escuchando..." },
  settings: { title: "Ajustes", sections: { security: "SEGURIDAD", privacy: "PRIVACIDAD", notifications: "NOTIFICACIONES", recurringPrompts: "RECORDATORIOS RECURRENTES", appearance: "APARIENCIA", language: "IDIOMA", social: "SOCIAL", backup: "COPIA & RESTAURAR", danger: "ZONA DE PELIGRO" }, rows: { appLock: "Bloqueo de App", biometric: "Desbloqueo Biométrico", autoLock: "Bloqueo Automático", decoyPin: "PIN Señuelo", guestPass: "Acceso de Invitado", localOnly: "Solo Local", screenshot: "Protección de Pantalla", stripMetadata: "Eliminar Metadatos", dailyReminder: "Recordatorio Diario", theme: "Tema", fontColor: "Color de Fuente", appLanguage: "Idioma de la App", export: "Exportar Copia", encryptedExport: "Exportar Cifrado", import: "Importar Copia", generateCodes: "Generar Códigos de Recuperación", backupPassphrase: "Frase de Copia", wipeAll: "Borrar Todo", deleteAccount: "Eliminar Cuenta", signOut: "Cerrar Sesión" }, language: { title: "Idioma" }, appearance: { theme: "Tema", dark: "Oscuro", light: "Claro", system: "Sistema" } },
  auth: { signIn: "Iniciar Sesión", signUp: "Registrarse", email: "Correo", password: "Contraseña", continueWithGoogle: "Continuar con Google", continueWithApple: "Continuar con Apple", noAccount: "¿No tienes cuenta?", hasAccount: "¿Ya tienes cuenta?", guestPreview: "Continuar como Invitado", verifyEmail: "Revisa tu correo para un código de verificación.", verifyCode: "Código de verificación", verify: "Verificar" },
};

export const fr: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Chronologie", search: "Rechercher", settings: "Paramètres" },
  common: { cancel: "Annuler", save: "Enregistrer", delete: "Supprimer", generating: "Génération...", today: "Aujourd'hui", yesterday: "Hier", thisWeek: "Cette Semaine", lastWeek: "Semaine Dernière", ok: "OK", share: "Partager", tapForToday: "appuyer pour aujourd'hui", newEntry: "NOUVELLE ENTRÉE", result: "résultat", results: "résultats", error: "Quelque chose a mal tourné. Veuillez réessayer.", noEntriesYet: "Pas encore d'entrées" },
  timeline: { emptyTitle: "Pas encore d'entrées", emptySubtitle: "Votre preuve de vie est ici.\nAppuyez sur + pour ajouter votre première entrée.", noTagEntries: "Pas encore d'entrées {{tag}}." },
  search: { title: "Rechercher", placeholder: "Titre, tag ou contenu...", noResults: "Aucun résultat", noResultsSub: "Essayez d'autres mots-clés ou filtres", startSearching: "Commencer à chercher", startSearchingSub: "Recherchez par titre, tag ou contenu" },
  add: { whatHappened: "Que s'est-il passé ?", addDetails: "Ajouter des détails...", listening: "Écoute..." },
  settings: { title: "Paramètres", sections: { security: "SÉCURITÉ", privacy: "CONFIDENTIALITÉ", notifications: "NOTIFICATIONS", recurringPrompts: "RAPPELS RÉCURRENTS", appearance: "APPARENCE", language: "LANGUE", social: "SOCIAL", backup: "SAUVEGARDE & RESTAURATION", danger: "ZONE DANGEREUSE" }, rows: { appLock: "Verrouillage App", biometric: "Déverrouillage Biométrique", autoLock: "Verrouillage Auto", decoyPin: "PIN Leurre", guestPass: "Accès Invité", localOnly: "Mode Local Uniquement", screenshot: "Protection Capture", stripMetadata: "Supprimer Métadonnées", dailyReminder: "Rappel Quotidien", theme: "Thème", fontColor: "Couleur Police", appLanguage: "Langue App", export: "Exporter Sauvegarde", encryptedExport: "Export Chiffré", import: "Importer Sauvegarde", generateCodes: "Générer Codes de Récupération", backupPassphrase: "Phrase de Sauvegarde", wipeAll: "Tout Effacer", deleteAccount: "Supprimer le Compte", signOut: "Déconnexion" }, language: { title: "Langue" }, appearance: { theme: "Thème", dark: "Sombre", light: "Clair", system: "Système" } },
  auth: { signIn: "Se Connecter", signUp: "S'inscrire", email: "E-mail", password: "Mot de passe", continueWithGoogle: "Continuer avec Google", continueWithApple: "Continuer avec Apple", noAccount: "Pas de compte ?", hasAccount: "Déjà un compte ?", guestPreview: "Continuer en tant qu'invité", verifyEmail: "Vérifiez votre e-mail pour un code de vérification.", verifyCode: "Code de vérification", verify: "Vérifier" },
};

export const de: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Zeitleiste", search: "Suchen", settings: "Einstellungen" },
  common: { cancel: "Abbrechen", save: "Speichern", delete: "Löschen", generating: "Generierung...", today: "Heute", yesterday: "Gestern", thisWeek: "Diese Woche", lastWeek: "Letzte Woche", ok: "OK", share: "Teilen", tapForToday: "für heute tippen", newEntry: "NEUER EINTRAG", result: "Ergebnis", results: "Ergebnisse", error: "Etwas ist schiefgelaufen. Bitte versuche es erneut.", noEntriesYet: "Noch keine Einträge" },
  timeline: { emptyTitle: "Noch keine Einträge", emptySubtitle: "Hier lebt dein Lebensnachweis.\nTippe auf +, um deinen ersten Eintrag zu speichern.", noTagEntries: "Noch keine {{tag}}-Einträge." },
  search: { title: "Suchen", placeholder: "Titel, Tag oder Inhalt...", noResults: "Keine Ergebnisse", noResultsSub: "Andere Keywords oder Filter versuchen", startSearching: "Suche beginnen", startSearchingSub: "Nach Titel, Tag oder Inhalt suchen" },
  add: { whatHappened: "Was ist passiert?", addDetails: "Details hinzufügen...", listening: "Höre zu..." },
  settings: { title: "Einstellungen", sections: { security: "SICHERHEIT", privacy: "DATENSCHUTZ", notifications: "BENACHRICHTIGUNGEN", recurringPrompts: "WIEDERKEHRENDE ERINNERUNGEN", appearance: "ERSCHEINUNGSBILD", language: "SPRACHE", social: "SOZIAL", backup: "BACKUP & WIEDERHERSTELLUNG", danger: "GEFAHRENZONE" }, rows: { appLock: "App-Sperre", biometric: "Biometrische Entsperrung", autoLock: "Auto-Sperre", decoyPin: "Köder-PIN", guestPass: "Gast-Zugang", localOnly: "Nur Lokal", screenshot: "Screenshot-Schutz", stripMetadata: "Foto-Metadaten Entfernen", dailyReminder: "Tägliche Erinnerung", theme: "Thema", fontColor: "Schriftfarbe", appLanguage: "App-Sprache", export: "Backup Exportieren", encryptedExport: "Verschlüsselter Export", import: "Backup Importieren", generateCodes: "Wiederherstellungscodes Generieren", backupPassphrase: "Backup-Passphrase", wipeAll: "Alles Löschen", deleteAccount: "Konto Löschen", signOut: "Abmelden" }, language: { title: "Sprache" }, appearance: { theme: "Thema", dark: "Dunkel", light: "Hell", system: "System" } },
  auth: { signIn: "Anmelden", signUp: "Registrieren", email: "E-Mail", password: "Passwort", continueWithGoogle: "Mit Google fortfahren", continueWithApple: "Mit Apple fortfahren", noAccount: "Kein Konto?", hasAccount: "Schon ein Konto?", guestPreview: "Als Gast fortfahren", verifyEmail: "Prüfe deine E-Mail auf einen Bestätigungscode.", verifyCode: "Bestätigungscode", verify: "Verifizieren" },
};

export const pt: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Linha do Tempo", search: "Pesquisar", settings: "Configurações" },
  common: { cancel: "Cancelar", save: "Salvar", delete: "Excluir", generating: "Gerando...", today: "Hoje", yesterday: "Ontem", thisWeek: "Esta Semana", lastWeek: "Semana Passada", ok: "OK", share: "Compartilhar", tapForToday: "toque para hoje", newEntry: "NOVA ENTRADA", result: "resultado", results: "resultados", error: "Algo deu errado. Por favor tente novamente.", noEntriesYet: "Nenhuma entrada ainda" },
  timeline: { emptyTitle: "Nenhuma entrada ainda", emptySubtitle: "Suas provas de vida ficam aqui.\nToque em + para salvar sua primeira entrada.", noTagEntries: "Nenhuma entrada {{tag}} ainda." },
  search: { title: "Pesquisar", placeholder: "Título, tag ou conteúdo...", noResults: "Nenhum resultado", noResultsSub: "Tente palavras-chave ou filtros diferentes", startSearching: "Comece a pesquisar", startSearchingSub: "Pesquise por título, tag ou conteúdo" },
  add: { whatHappened: "O que aconteceu?", addDetails: "Adicionar detalhes...", listening: "Ouvindo..." },
  settings: { title: "Configurações", sections: { security: "SEGURANÇA", privacy: "PRIVACIDADE", notifications: "NOTIFICAÇÕES", recurringPrompts: "LEMBRETES RECORRENTES", appearance: "APARÊNCIA", language: "IDIOMA", social: "SOCIAL", backup: "BACKUP & RESTAURAÇÃO", danger: "ZONA DE PERIGO" }, rows: { appLock: "Bloqueio do App", biometric: "Desbloqueio Biométrico", autoLock: "Bloqueio Auto", decoyPin: "PIN Chamariz", guestPass: "Acesso de Convidado", localOnly: "Somente Local", screenshot: "Proteção de Tela", stripMetadata: "Remover Metadados", dailyReminder: "Lembrete Diário", theme: "Tema", fontColor: "Cor da Fonte", appLanguage: "Idioma do App", export: "Exportar Backup", encryptedExport: "Exportar Criptografado", import: "Importar Backup", generateCodes: "Gerar Códigos de Recuperação", backupPassphrase: "Frase de Backup", wipeAll: "Apagar Tudo", deleteAccount: "Excluir Conta", signOut: "Sair" }, language: { title: "Idioma" }, appearance: { theme: "Tema", dark: "Escuro", light: "Claro", system: "Sistema" } },
  auth: { signIn: "Entrar", signUp: "Cadastrar", email: "E-mail", password: "Senha", continueWithGoogle: "Continuar com Google", continueWithApple: "Continuar com Apple", noAccount: "Não tem conta?", hasAccount: "Já tem conta?", guestPreview: "Continuar como Convidado", verifyEmail: "Verifique seu e-mail para um código de verificação.", verifyCode: "Código de verificação", verify: "Verificar" },
};

export const it: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Cronologia", search: "Cerca", settings: "Impostazioni" },
  common: { cancel: "Annulla", save: "Salva", delete: "Elimina", generating: "Generazione...", today: "Oggi", yesterday: "Ieri", thisWeek: "Questa Settimana", lastWeek: "Settimana Scorsa", ok: "OK", share: "Condividi", tapForToday: "tocca per oggi", newEntry: "NUOVA VOCE", result: "risultato", results: "risultati", error: "Qualcosa è andato storto. Riprova.", noEntriesYet: "Nessuna voce ancora" },
  timeline: { emptyTitle: "Nessuna voce ancora", emptySubtitle: "Le tue prove di vita vivono qui.\nTocca + per salvare la prima voce.", noTagEntries: "Nessuna voce {{tag}} ancora." },
  search: { title: "Cerca", placeholder: "Titolo, tag o contenuto...", noResults: "Nessun risultato", noResultsSub: "Prova parole chiave o filtri diversi", startSearching: "Inizia a cercare", startSearchingSub: "Cerca per titolo, tag o contenuto" },
  add: { whatHappened: "Cosa è successo?", addDetails: "Aggiungi dettagli...", listening: "Ascolto..." },
  settings: { title: "Impostazioni", sections: { security: "SICUREZZA", privacy: "PRIVACY", notifications: "NOTIFICHE", recurringPrompts: "PROMEMORIA RICORRENTI", appearance: "ASPETTO", language: "LINGUA", social: "SOCIAL", backup: "BACKUP & RIPRISTINO", danger: "ZONA PERICOLOSA" }, rows: { appLock: "Blocco App", biometric: "Sblocco Biometrico", autoLock: "Blocco Auto", decoyPin: "PIN Esca", guestPass: "Accesso Ospite", localOnly: "Solo Locale", screenshot: "Protezione Screenshot", stripMetadata: "Rimuovi Metadati", dailyReminder: "Promemoria Giornaliero", theme: "Tema", fontColor: "Colore Carattere", appLanguage: "Lingua App", export: "Esporta Backup", encryptedExport: "Esporta Cifrato", import: "Importa Backup", generateCodes: "Genera Codici di Recupero", backupPassphrase: "Passphrase Backup", wipeAll: "Cancella Tutto", deleteAccount: "Elimina Account", signOut: "Esci" }, language: { title: "Lingua" }, appearance: { theme: "Tema", dark: "Scuro", light: "Chiaro", system: "Sistema" } },
  auth: { signIn: "Accedi", signUp: "Registrati", email: "E-mail", password: "Password", continueWithGoogle: "Continua con Google", continueWithApple: "Continua con Apple", noAccount: "Non hai un account?", hasAccount: "Hai già un account?", guestPreview: "Continua come Ospite", verifyEmail: "Controlla la tua email per un codice di verifica.", verifyCode: "Codice di verifica", verify: "Verifica" },
};

export const ja: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "タイムライン", search: "検索", settings: "設定" },
  common: { cancel: "キャンセル", save: "保存", delete: "削除", generating: "生成中...", today: "今日", yesterday: "昨日", thisWeek: "今週", lastWeek: "先週", ok: "OK", share: "共有", tapForToday: "今日にタップ", newEntry: "新しいエントリ", result: "件", results: "件", error: "問題が発生しました。もう一度お試しください。", noEntriesYet: "まだエントリがありません" },
  timeline: { emptyTitle: "まだエントリがありません", emptySubtitle: "あなたの人生の証拠はここにあります。\n+をタップして最初のエントリを保存しましょう。", noTagEntries: "{{tag}}のエントリはまだありません。" },
  search: { title: "検索", placeholder: "タイトル、タグ、またはコンテンツ...", noResults: "結果が見つかりません", noResultsSub: "別のキーワードやフィルターを試してください", startSearching: "検索を始める", startSearchingSub: "タイトル、タグ、またはコンテンツで検索" },
  add: { whatHappened: "何が起きましたか？", addDetails: "詳細を追加...", listening: "聞き取り中..." },
  settings: { title: "設定", sections: { security: "セキュリティ", privacy: "プライバシー", notifications: "通知", recurringPrompts: "定期プロンプト", appearance: "外観", language: "言語", social: "ソーシャル", backup: "バックアップ & 復元", danger: "危険ゾーン" }, rows: { appLock: "アプリロック", biometric: "生体認証ロック解除", autoLock: "自動ロック", decoyPin: "デコイPIN", guestPass: "ゲストパス", localOnly: "ローカルのみ", screenshot: "スクリーンショット保護", stripMetadata: "写真メタデータ削除", dailyReminder: "毎日のリマインダー", theme: "テーマ", fontColor: "フォントカラー", appLanguage: "アプリの言語", export: "バックアップを書き出す", encryptedExport: "暗号化エクスポート", import: "バックアップを読み込む", generateCodes: "回復コードを生成", backupPassphrase: "バックアップパスフレーズ", wipeAll: "すべて削除", deleteAccount: "アカウントを削除", signOut: "サインアウト" }, language: { title: "言語" }, appearance: { theme: "テーマ", dark: "ダーク", light: "ライト", system: "システム" } },
  auth: { signIn: "サインイン", signUp: "サインアップ", email: "メール", password: "パスワード", continueWithGoogle: "Googleで続ける", continueWithApple: "Appleで続ける", noAccount: "アカウントをお持ちでないですか？", hasAccount: "既にアカウントをお持ちですか？", guestPreview: "ゲストとして続ける", verifyEmail: "確認コードのためにメールを確認してください。", verifyCode: "確認コード", verify: "確認" },
};

export const ko: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "타임라인", search: "검색", settings: "설정" },
  common: { cancel: "취소", save: "저장", delete: "삭제", generating: "생성 중...", today: "오늘", yesterday: "어제", thisWeek: "이번 주", lastWeek: "지난 주", ok: "확인", share: "공유", tapForToday: "오늘로 이동", newEntry: "새 항목", result: "건", results: "건", error: "문제가 발생했습니다. 다시 시도하세요.", noEntriesYet: "아직 항목이 없습니다" },
  timeline: { emptyTitle: "아직 항목이 없습니다", emptySubtitle: "당신의 삶의 증거가 여기에 있습니다.\n+를 눌러 첫 번째 항목을 저장하세요.", noTagEntries: "{{tag}} 항목이 아직 없습니다." },
  search: { title: "검색", placeholder: "제목, 태그 또는 내용...", noResults: "결과 없음", noResultsSub: "다른 키워드나 필터를 시도하세요", startSearching: "검색 시작", startSearchingSub: "제목, 태그 또는 내용으로 검색" },
  add: { whatHappened: "무슨 일이 있었나요?", addDetails: "세부 정보 추가...", listening: "듣는 중..." },
  settings: { title: "설정", sections: { security: "보안", privacy: "개인 정보", notifications: "알림", recurringPrompts: "반복 알림", appearance: "외관", language: "언어", social: "소셜", backup: "백업 & 복원", danger: "위험 구역" }, rows: { appLock: "앱 잠금", biometric: "생체 인식 잠금 해제", autoLock: "자동 잠금", decoyPin: "데코이 PIN", guestPass: "게스트 패스", localOnly: "로컬 전용", screenshot: "스크린샷 보호", stripMetadata: "사진 메타데이터 제거", dailyReminder: "일일 알림", theme: "테마", fontColor: "글꼴 색상", appLanguage: "앱 언어", export: "백업 내보내기", encryptedExport: "암호화 내보내기", import: "백업 가져오기", generateCodes: "복구 코드 생성", backupPassphrase: "백업 암호", wipeAll: "모두 삭제", deleteAccount: "계정 삭제", signOut: "로그아웃" }, language: { title: "언어" }, appearance: { theme: "테마", dark: "다크", light: "라이트", system: "시스템" } },
  auth: { signIn: "로그인", signUp: "가입", email: "이메일", password: "비밀번호", continueWithGoogle: "Google로 계속", continueWithApple: "Apple로 계속", noAccount: "계정이 없으신가요?", hasAccount: "이미 계정이 있으신가요?", guestPreview: "게스트로 계속", verifyEmail: "인증 코드를 위해 이메일을 확인하세요.", verifyCode: "인증 코드", verify: "확인" },
};

export const zh: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "时间线", search: "搜索", settings: "设置" },
  common: { cancel: "取消", save: "保存", delete: "删除", generating: "生成中...", today: "今天", yesterday: "昨天", thisWeek: "本周", lastWeek: "上周", ok: "好", share: "分享", tapForToday: "点击到今天", newEntry: "新条目", result: "条", results: "条", error: "出了点问题，请重试。", noEntriesYet: "还没有条目" },
  timeline: { emptyTitle: "还没有条目", emptySubtitle: "你的生活证明在这里。\n点击 + 保存你的第一条。", noTagEntries: "还没有 {{tag}} 条目。" },
  search: { title: "搜索", placeholder: "标题、标签或内容...", noResults: "没有结果", noResultsSub: "尝试不同的关键词或过滤器", startSearching: "开始搜索", startSearchingSub: "按标题、标签或内容搜索" },
  add: { whatHappened: "发生了什么？", addDetails: "添加详情...", listening: "听取中..." },
  settings: { title: "设置", sections: { security: "安全", privacy: "隐私", notifications: "通知", recurringPrompts: "定期提示", appearance: "外观", language: "语言", social: "社交", backup: "备份与恢复", danger: "危险区" }, rows: { appLock: "应用锁定", biometric: "生物识别解锁", autoLock: "自动锁定", decoyPin: "诱饵PIN", guestPass: "访客通行证", localOnly: "仅本地", screenshot: "截图保护", stripMetadata: "删除照片元数据", dailyReminder: "每日提醒", theme: "主题", fontColor: "字体颜色", appLanguage: "应用语言", export: "导出备份", encryptedExport: "加密导出", import: "导入备份", generateCodes: "生成恢复码", backupPassphrase: "备份密语", wipeAll: "清除所有", deleteAccount: "删除账户", signOut: "退出登录" }, language: { title: "语言" }, appearance: { theme: "主题", dark: "深色", light: "浅色", system: "系统" } },
  auth: { signIn: "登录", signUp: "注册", email: "邮箱", password: "密码", continueWithGoogle: "用Google继续", continueWithApple: "用Apple继续", noAccount: "没有账户？", hasAccount: "已有账户？", guestPreview: "以访客身份继续", verifyEmail: "请检查您的电子邮件以获取验证码。", verifyCode: "验证码", verify: "验证" },
};

export const ar: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "الجدول الزمني", search: "بحث", settings: "الإعدادات" },
  common: { cancel: "إلغاء", save: "حفظ", delete: "حذف", generating: "جارٍ الإنشاء...", today: "اليوم", yesterday: "أمس", thisWeek: "هذا الأسبوع", lastWeek: "الأسبوع الماضي", ok: "موافق", share: "مشاركة", tapForToday: "اضغط لليوم", newEntry: "إدخال جديد", result: "نتيجة", results: "نتائج", error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.", noEntriesYet: "لا إدخالات بعد" },
  timeline: { emptyTitle: "لا إدخالات بعد", emptySubtitle: "دليل حياتك يعيش هنا.\naضغط + لحفظ أول إدخال.", noTagEntries: "لا توجد إدخالات {{tag}} بعد." },
  search: { title: "بحث", placeholder: "عنوان، وسم، أو محتوى...", noResults: "لا توجد نتائج", noResultsSub: "جرب كلمات مفتاحية أو مرشحات مختلفة", startSearching: "ابدأ البحث", startSearchingSub: "ابحث بالعنوان أو الوسم أو المحتوى" },
  add: { whatHappened: "ماذا حدث؟", addDetails: "إضافة تفاصيل...", listening: "جارٍ الاستماع..." },
  settings: { title: "الإعدادات", sections: { security: "الأمان", privacy: "الخصوصية", notifications: "الإشعارات", recurringPrompts: "التذكيرات المتكررة", appearance: "المظهر", language: "اللغة", social: "اجتماعي", backup: "النسخ الاحتياطي والاستعادة", danger: "منطقة الخطر" }, rows: { appLock: "قفل التطبيق", biometric: "فتح بيومتري", autoLock: "قفل تلقائي", decoyPin: "PIN الخداع", guestPass: "تصريح ضيف", localOnly: "محلي فقط", screenshot: "حماية لقطة الشاشة", stripMetadata: "إزالة بيانات الصورة", dailyReminder: "تذكير يومي", theme: "السمة", fontColor: "لون الخط", appLanguage: "لغة التطبيق", export: "تصدير نسخة احتياطية", encryptedExport: "تصدير مشفر", import: "استيراد نسخة احتياطية", generateCodes: "إنشاء رموز الاسترداد", backupPassphrase: "عبارة مرور النسخ الاحتياطي", wipeAll: "مسح الكل", deleteAccount: "حذف الحساب", signOut: "تسجيل الخروج" }, language: { title: "اللغة" }, appearance: { theme: "السمة", dark: "داكن", light: "فاتح", system: "النظام" } },
  auth: { signIn: "تسجيل الدخول", signUp: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", continueWithGoogle: "المتابعة مع Google", continueWithApple: "المتابعة مع Apple", noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟", guestPreview: "المتابعة كضيف", verifyEmail: "تحقق من بريدك الإلكتروني للحصول على رمز التحقق.", verifyCode: "رمز التحقق", verify: "تحقق" },
};

export const hi: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "टाइमलाइन", search: "खोजें", settings: "सेटिंग्स" },
  common: { cancel: "रद्द करें", save: "सहेजें", delete: "हटाएं", generating: "बना रहा है...", today: "आज", yesterday: "कल", thisWeek: "इस सप्ताह", lastWeek: "पिछले सप्ताह", ok: "ठीक है", share: "साझा करें", tapForToday: "आज के लिए टैप करें", newEntry: "नई प्रविष्टि", result: "परिणाम", results: "परिणाम", error: "कुछ गलत हुआ। कृपया पुनः प्रयास करें।", noEntriesYet: "अभी तक कोई प्रविष्टि नहीं" },
  timeline: { emptyTitle: "अभी तक कोई प्रविष्टि नहीं", emptySubtitle: "आपके जीवन का प्रमाण यहाँ रहता है।\nपहली प्रविष्टि सहेजने के लिए + टैप करें।", noTagEntries: "अभी तक कोई {{tag}} प्रविष्टि नहीं।" },
  search: { title: "खोजें", placeholder: "शीर्षक, टैग या सामग्री...", noResults: "कोई परिणाम नहीं", noResultsSub: "अलग कीवर्ड या फ़िल्टर आजमाएं", startSearching: "खोज शुरू करें", startSearchingSub: "शीर्षक, टैग या सामग्री से खोजें" },
  add: { whatHappened: "क्या हुआ?", addDetails: "विवरण जोड़ें...", listening: "सुन रहा है..." },
  settings: { title: "सेटिंग्स", sections: { security: "सुरक्षा", privacy: "गोपनीयता", notifications: "सूचनाएं", recurringPrompts: "आवर्ती संकेत", appearance: "रूप-रंग", language: "भाषा", social: "सामाजिक", backup: "बैकअप & पुनर्स्थापना", danger: "खतरे का क्षेत्र" }, rows: { appLock: "ऐप लॉक", biometric: "बायोमेट्रिक अनलॉक", autoLock: "ऑटो-लॉक", decoyPin: "डिकॉय पिन", guestPass: "गेस्ट पास", localOnly: "केवल स्थानीय", screenshot: "स्क्रीनशॉट सुरक्षा", stripMetadata: "फोटो मेटाडेटा हटाएं", dailyReminder: "दैनिक अनुस्मारक", theme: "थीम", fontColor: "फ़ॉन्ट रंग", appLanguage: "ऐप भाषा", export: "बैकअप निर्यात करें", encryptedExport: "एन्क्रिप्टेड निर्यात", import: "बैकअप आयात करें", generateCodes: "रिकवरी कोड उत्पन्न करें", backupPassphrase: "बैकअप पासफ़्रेज़", wipeAll: "सब मिटाएं", deleteAccount: "खाता हटाएं", signOut: "साइन आउट" }, language: { title: "भाषा" }, appearance: { theme: "थीम", dark: "डार्क", light: "लाइट", system: "सिस्टम" } },
  auth: { signIn: "साइन इन", signUp: "साइन अप", email: "ईमेल", password: "पासवर्ड", continueWithGoogle: "Google से जारी रखें", continueWithApple: "Apple से जारी रखें", noAccount: "खाता नहीं है?", hasAccount: "पहले से खाता है?", guestPreview: "अतिथि के रूप में जारी रखें", verifyEmail: "सत्यापन कोड के लिए अपना ईमेल जांचें।", verifyCode: "सत्यापन कोड", verify: "सत्यापित करें" },
};

export const ru: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Хронология", search: "Поиск", settings: "Настройки" },
  common: { cancel: "Отмена", save: "Сохранить", delete: "Удалить", generating: "Генерация...", today: "Сегодня", yesterday: "Вчера", thisWeek: "На этой неделе", lastWeek: "На прошлой неделе", ok: "OK", share: "Поделиться", tapForToday: "нажмите для сегодня", newEntry: "НОВАЯ ЗАПИСЬ", result: "результат", results: "результатов", error: "Что-то пошло не так. Попробуйте ещё раз.", noEntriesYet: "Записей пока нет" },
  timeline: { emptyTitle: "Записей пока нет", emptySubtitle: "Здесь живут доказательства твоей жизни.\nНажми +, чтобы сохранить первую запись.", noTagEntries: "Записей {{tag}} пока нет." },
  search: { title: "Поиск", placeholder: "Заголовок, тег или содержимое...", noResults: "Результатов нет", noResultsSub: "Попробуйте другие ключевые слова или фильтры", startSearching: "Начните поиск", startSearchingSub: "Ищите по заголовку, тегу или содержимому" },
  add: { whatHappened: "Что произошло?", addDetails: "Добавить детали...", listening: "Слушаю..." },
  settings: { title: "Настройки", sections: { security: "БЕЗОПАСНОСТЬ", privacy: "КОНФИДЕНЦИАЛЬНОСТЬ", notifications: "УВЕДОМЛЕНИЯ", recurringPrompts: "ПОВТОРЯЮЩИЕСЯ НАПОМИНАНИЯ", appearance: "ВНЕШНИЙ ВИД", language: "ЯЗЫК", social: "СОЦИАЛЬНЫЕ СЕТИ", backup: "РЕЗЕРВНОЕ КОПИРОВАНИЕ", danger: "ОПАСНАЯ ЗОНА" }, rows: { appLock: "Блокировка приложения", biometric: "Биометрическая разблокировка", autoLock: "Автоблокировка", decoyPin: "ПИН-приманка", guestPass: "Гостевой доступ", localOnly: "Только локально", screenshot: "Защита от скриншотов", stripMetadata: "Удалить метаданные фото", dailyReminder: "Ежедневное напоминание", theme: "Тема", fontColor: "Цвет шрифта", appLanguage: "Язык приложения", export: "Экспорт резервной копии", encryptedExport: "Шифрованный экспорт", import: "Импорт резервной копии", generateCodes: "Создать коды восстановления", backupPassphrase: "Фраза резервного копирования", wipeAll: "Удалить всё", deleteAccount: "Удалить аккаунт", signOut: "Выйти" }, language: { title: "Язык" }, appearance: { theme: "Тема", dark: "Тёмная", light: "Светлая", system: "Системная" } },
  auth: { signIn: "Войти", signUp: "Зарегистрироваться", email: "Эл. почта", password: "Пароль", continueWithGoogle: "Продолжить с Google", continueWithApple: "Продолжить с Apple", noAccount: "Нет аккаунта?", hasAccount: "Уже есть аккаунт?", guestPreview: "Продолжить как гость", verifyEmail: "Проверьте почту на код подтверждения.", verifyCode: "Код подтверждения", verify: "Подтвердить" },
};

export const tr: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Zaman Tüneli", search: "Ara", settings: "Ayarlar" },
  common: { cancel: "İptal", save: "Kaydet", delete: "Sil", generating: "Oluşturuluyor...", today: "Bugün", yesterday: "Dün", thisWeek: "Bu Hafta", lastWeek: "Geçen Hafta", ok: "Tamam", share: "Paylaş", tapForToday: "bugün için dokun", newEntry: "YENİ GİRİŞ", result: "sonuç", results: "sonuç", error: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.", noEntriesYet: "Henüz giriş yok" },
  timeline: { emptyTitle: "Henüz giriş yok", emptySubtitle: "Hayatının kanıtı burada yaşıyor.\nİlk girişini kaydetmek için + tıkla.", noTagEntries: "Henüz {{tag}} girişi yok." },
  search: { title: "Ara", placeholder: "Başlık, etiket veya içerik...", noResults: "Sonuç bulunamadı", noResultsSub: "Farklı anahtar kelimeler veya filtreler deneyin", startSearching: "Aramaya başla", startSearchingSub: "Başlık, etiket veya içeriğe göre ara" },
  add: { whatHappened: "Ne oldu?", addDetails: "Detay ekle...", listening: "Dinleniyor..." },
  settings: { title: "Ayarlar", sections: { security: "GÜVENLİK", privacy: "GİZLİLİK", notifications: "BİLDİRİMLER", recurringPrompts: "TEKRARLAYAN HATIRLATICILAR", appearance: "GÖRÜNÜM", language: "DİL", social: "SOSYAL", backup: "YEDEKLEME & GERİ YÜKLEME", danger: "TEHLİKE BÖLGESİ" }, rows: { appLock: "Uygulama Kilidi", biometric: "Biyometrik Kilit Açma", autoLock: "Otomatik Kilit", decoyPin: "Yem PIN", guestPass: "Misafir Geçişi", localOnly: "Yalnızca Yerel", screenshot: "Ekran Görüntüsü Koruması", stripMetadata: "Fotoğraf Meta Verisini Kaldır", dailyReminder: "Günlük Hatırlatıcı", theme: "Tema", fontColor: "Yazı Tipi Rengi", appLanguage: "Uygulama Dili", export: "Yedek Dışa Aktar", encryptedExport: "Şifreli Dışa Aktar", import: "Yedek İçe Aktar", generateCodes: "Kurtarma Kodları Oluştur", backupPassphrase: "Yedek Parola İfadesi", wipeAll: "Tümünü Sil", deleteAccount: "Hesabı Sil", signOut: "Çıkış Yap" }, language: { title: "Dil" }, appearance: { theme: "Tema", dark: "Koyu", light: "Açık", system: "Sistem" } },
  auth: { signIn: "Giriş Yap", signUp: "Kayıt Ol", email: "E-posta", password: "Şifre", continueWithGoogle: "Google ile devam et", continueWithApple: "Apple ile devam et", noAccount: "Hesabın yok mu?", hasAccount: "Zaten hesabın var mı?", guestPreview: "Misafir olarak devam et", verifyEmail: "Doğrulama kodu için e-postanı kontrol et.", verifyCode: "Doğrulama kodu", verify: "Doğrula" },
};

export const nl: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Tijdlijn", search: "Zoeken", settings: "Instellingen" },
  common: { cancel: "Annuleren", save: "Opslaan", delete: "Verwijderen", generating: "Genereren...", today: "Vandaag", yesterday: "Gisteren", thisWeek: "Deze Week", lastWeek: "Vorige Week", ok: "OK", share: "Delen", tapForToday: "tik voor vandaag", newEntry: "NIEUW ITEM", result: "resultaat", results: "resultaten", error: "Er ging iets mis. Probeer het opnieuw.", noEntriesYet: "Nog geen items" },
  timeline: { emptyTitle: "Nog geen items", emptySubtitle: "Jouw levensbewijs leeft hier.\nTik + om je eerste item op te slaan.", noTagEntries: "Nog geen {{tag}} items." },
  search: { title: "Zoeken", placeholder: "Titel, tag of inhoud...", noResults: "Geen resultaten gevonden", noResultsSub: "Probeer andere trefwoorden of filters", startSearching: "Begin met zoeken", startSearchingSub: "Zoek op titel, tag of inhoud" },
  add: { whatHappened: "Wat is er gebeurd?", addDetails: "Details toevoegen...", listening: "Luisteren..." },
  settings: { title: "Instellingen", sections: { security: "BEVEILIGING", privacy: "PRIVACY", notifications: "MELDINGEN", recurringPrompts: "TERUGKERENDE HERINNERINGEN", appearance: "UITERLIJK", language: "TAAL", social: "SOCIAAL", backup: "BACK-UP & HERSTEL", danger: "GEVAARZONE" }, rows: { appLock: "App-vergrendeling", biometric: "Biometrisch Ontgrendelen", autoLock: "Auto-vergrendeling", decoyPin: "Lokvogel-PIN", guestPass: "Gastpas", localOnly: "Alleen Lokaal", screenshot: "Screenshot-beveiliging", stripMetadata: "Fotometadata Verwijderen", dailyReminder: "Dagelijkse Herinnering", theme: "Thema", fontColor: "Letterkleur", appLanguage: "App-taal", export: "Back-up Exporteren", encryptedExport: "Versleuteld Exporteren", import: "Back-up Importeren", generateCodes: "Herstelcodes Genereren", backupPassphrase: "Back-up Wachtwoordzin", wipeAll: "Alles Wissen", deleteAccount: "Account Verwijderen", signOut: "Uitloggen" }, language: { title: "Taal" }, appearance: { theme: "Thema", dark: "Donker", light: "Licht", system: "Systeem" } },
  auth: { signIn: "Inloggen", signUp: "Registreren", email: "E-mail", password: "Wachtwoord", continueWithGoogle: "Doorgaan met Google", continueWithApple: "Doorgaan met Apple", noAccount: "Geen account?", hasAccount: "Al een account?", guestPreview: "Doorgaan als gast", verifyEmail: "Controleer je e-mail voor een verificatiecode.", verifyCode: "Verificatiecode", verify: "Verifiëren" },
};

export const pl: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Oś Czasu", search: "Szukaj", settings: "Ustawienia" },
  common: { cancel: "Anuluj", save: "Zapisz", delete: "Usuń", generating: "Generowanie...", today: "Dzisiaj", yesterday: "Wczoraj", thisWeek: "W tym tygodniu", lastWeek: "W zeszłym tygodniu", ok: "OK", share: "Udostępnij", tapForToday: "dotknij dla dzisiaj", newEntry: "NOWY WPIS", result: "wynik", results: "wyniki", error: "Coś poszło nie tak. Spróbuj ponownie.", noEntriesYet: "Brak wpisów" },
  timeline: { emptyTitle: "Brak wpisów", emptySubtitle: "Twój dowód życia mieszka tutaj.\nDotknij +, aby zapisać pierwszy wpis.", noTagEntries: "Brak wpisów {{tag}}." },
  search: { title: "Szukaj", placeholder: "Tytuł, tag lub zawartość...", noResults: "Brak wyników", noResultsSub: "Spróbuj innych słów kluczowych lub filtrów", startSearching: "Zacznij szukać", startSearchingSub: "Szukaj według tytułu, tagu lub zawartości" },
  add: { whatHappened: "Co się stało?", addDetails: "Dodaj szczegóły...", listening: "Nasłuchiwanie..." },
  settings: { title: "Ustawienia", sections: { security: "BEZPIECZEŃSTWO", privacy: "PRYWATNOŚĆ", notifications: "POWIADOMIENIA", recurringPrompts: "POWTARZAJĄCE SIĘ PRZYPOMNIENIA", appearance: "WYGLĄD", language: "JĘZYK", social: "SPOŁECZNOŚCIOWE", backup: "KOPIA ZAPASOWA I PRZYWRACANIE", danger: "STREFA NIEBEZPIECZEŃSTWA" }, rows: { appLock: "Blokada Aplikacji", biometric: "Odblokowanie Biometryczne", autoLock: "Automatyczna Blokada", decoyPin: "PIN Przynęta", guestPass: "Przepustka Gości", localOnly: "Tylko Lokalnie", screenshot: "Ochrona Zrzutów Ekranu", stripMetadata: "Usuń Metadane Zdjęć", dailyReminder: "Codzienne Przypomnienie", theme: "Motyw", fontColor: "Kolor Czcionki", appLanguage: "Język Aplikacji", export: "Eksport Kopii Zapasowej", encryptedExport: "Zaszyfrowany Eksport", import: "Import Kopii Zapasowej", generateCodes: "Generuj Kody Odzyskiwania", backupPassphrase: "Hasło Kopii Zapasowej", wipeAll: "Wyczyść Wszystko", deleteAccount: "Usuń Konto", signOut: "Wyloguj" }, language: { title: "Język" }, appearance: { theme: "Motyw", dark: "Ciemny", light: "Jasny", system: "Systemowy" } },
  auth: { signIn: "Zaloguj się", signUp: "Zarejestruj się", email: "E-mail", password: "Hasło", continueWithGoogle: "Kontynuuj z Google", continueWithApple: "Kontynuuj z Apple", noAccount: "Nie masz konta?", hasAccount: "Masz już konto?", guestPreview: "Kontynuuj jako gość", verifyEmail: "Sprawdź swój e-mail w poszukiwaniu kodu weryfikacyjnego.", verifyCode: "Kod weryfikacyjny", verify: "Zweryfikuj" },
};

export const sv: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Tidslinje", search: "Sök", settings: "Inställningar" },
  common: { cancel: "Avbryt", save: "Spara", delete: "Radera", generating: "Genererar...", today: "Idag", yesterday: "Igår", thisWeek: "Denna vecka", lastWeek: "Förra veckan", ok: "OK", share: "Dela", tapForToday: "tryck för idag", newEntry: "NY POST", result: "resultat", results: "resultat", error: "Något gick fel. Försök igen.", noEntriesYet: "Inga poster ännu" },
  timeline: { emptyTitle: "Inga poster ännu", emptySubtitle: "Ditt livs bevis lever här.\nTryck + för att spara din första post.", noTagEntries: "Inga {{tag}}-poster ännu." },
  search: { title: "Sök", placeholder: "Titel, tagg eller innehåll...", noResults: "Inga resultat hittades", noResultsSub: "Prova andra sökord eller filter", startSearching: "Börja söka", startSearchingSub: "Sök efter titel, tagg eller innehåll" },
  add: { whatHappened: "Vad hände?", addDetails: "Lägg till detaljer...", listening: "Lyssnar..." },
  settings: { title: "Inställningar", sections: { security: "SÄKERHET", privacy: "INTEGRITET", notifications: "NOTIFIERINGAR", recurringPrompts: "ÅTERKOMMANDE PÅMINNELSER", appearance: "UTSEENDE", language: "SPRÅK", social: "SOCIALT", backup: "SÄKERHETSKOPIERING & ÅTERSTÄLLNING", danger: "FAROZON" }, rows: { appLock: "Applås", biometric: "Biometrisk Upplåsning", autoLock: "Autolås", decoyPin: "Bete-PIN", guestPass: "Gästpass", localOnly: "Endast Lokalt", screenshot: "Skärmbildsskydd", stripMetadata: "Ta Bort Fotometadata", dailyReminder: "Daglig Påminnelse", theme: "Tema", fontColor: "Teckensnittsfärg", appLanguage: "Appspråk", export: "Exportera Säkerhetskopia", encryptedExport: "Krypterad Export", import: "Importera Säkerhetskopia", generateCodes: "Generera Återställningskoder", backupPassphrase: "Lösenordsfras för Säkerhetskopiering", wipeAll: "Rensa Allt", deleteAccount: "Radera Konto", signOut: "Logga Ut" }, language: { title: "Språk" }, appearance: { theme: "Tema", dark: "Mörkt", light: "Ljust", system: "System" } },
  auth: { signIn: "Logga In", signUp: "Registrera", email: "E-post", password: "Lösenord", continueWithGoogle: "Fortsätt med Google", continueWithApple: "Fortsätt med Apple", noAccount: "Inget konto?", hasAccount: "Har redan ett konto?", guestPreview: "Fortsätt som gäst", verifyEmail: "Kontrollera din e-post för en verifieringskod.", verifyCode: "Verifieringskod", verify: "Verifiera" },
};

export const id: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Linimasa", search: "Cari", settings: "Pengaturan" },
  common: { cancel: "Batal", save: "Simpan", delete: "Hapus", generating: "Membuat...", today: "Hari ini", yesterday: "Kemarin", thisWeek: "Minggu Ini", lastWeek: "Minggu Lalu", ok: "OK", share: "Bagikan", tapForToday: "ketuk untuk hari ini", newEntry: "ENTRI BARU", result: "hasil", results: "hasil", error: "Terjadi kesalahan. Silakan coba lagi.", noEntriesYet: "Belum ada entri" },
  timeline: { emptyTitle: "Belum ada entri", emptySubtitle: "Bukti hidupmu ada di sini.\nKetuk + untuk menyimpan entri pertamamu.", noTagEntries: "Belum ada entri {{tag}}." },
  search: { title: "Cari", placeholder: "Judul, tag, atau konten...", noResults: "Tidak ada hasil", noResultsSub: "Coba kata kunci atau filter yang berbeda", startSearching: "Mulai mencari", startSearchingSub: "Cari berdasarkan judul, tag, atau konten" },
  add: { whatHappened: "Apa yang terjadi?", addDetails: "Tambahkan detail...", listening: "Mendengarkan..." },
  settings: { title: "Pengaturan", sections: { security: "KEAMANAN", privacy: "PRIVASI", notifications: "NOTIFIKASI", recurringPrompts: "PENGINGAT BERULANG", appearance: "TAMPILAN", language: "BAHASA", social: "SOSIAL", backup: "CADANGAN & PEMULIHAN", danger: "ZONA BERBAHAYA" }, rows: { appLock: "Kunci Aplikasi", biometric: "Buka Kunci Biometrik", autoLock: "Kunci Otomatis", decoyPin: "PIN Umpan", guestPass: "Akses Tamu", localOnly: "Hanya Lokal", screenshot: "Perlindungan Tangkapan Layar", stripMetadata: "Hapus Metadata Foto", dailyReminder: "Pengingat Harian", theme: "Tema", fontColor: "Warna Fon", appLanguage: "Bahasa Aplikasi", export: "Ekspor Cadangan", encryptedExport: "Ekspor Terenkripsi", import: "Impor Cadangan", generateCodes: "Buat Kode Pemulihan", backupPassphrase: "Frasa Sandi Cadangan", wipeAll: "Hapus Semua", deleteAccount: "Hapus Akun", signOut: "Keluar" }, language: { title: "Bahasa" }, appearance: { theme: "Tema", dark: "Gelap", light: "Terang", system: "Sistem" } },
  auth: { signIn: "Masuk", signUp: "Daftar", email: "Email", password: "Kata Sandi", continueWithGoogle: "Lanjutkan dengan Google", continueWithApple: "Lanjutkan dengan Apple", noAccount: "Belum punya akun?", hasAccount: "Sudah punya akun?", guestPreview: "Lanjutkan sebagai Tamu", verifyEmail: "Periksa emailmu untuk kode verifikasi.", verifyCode: "Kode verifikasi", verify: "Verifikasi" },
};

export const uk: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Хронологія", search: "Пошук", settings: "Налаштування" },
  common: { cancel: "Скасувати", save: "Зберегти", delete: "Видалити", generating: "Генерація...", today: "Сьогодні", yesterday: "Вчора", thisWeek: "Цього тижня", lastWeek: "Минулого тижня", ok: "OK", share: "Поділитися", tapForToday: "торкніться для сьогодні", newEntry: "НОВИЙ ЗАПИС", result: "результат", results: "результатів", error: "Щось пішло не так. Спробуйте ще раз.", noEntriesYet: "Записів поки немає" },
  timeline: { emptyTitle: "Записів поки немає", emptySubtitle: "Тут живуть докази твого життя.\nНатисни +, щоб зберегти перший запис.", noTagEntries: "Записів {{tag}} поки немає." },
  search: { title: "Пошук", placeholder: "Заголовок, тег або вміст...", noResults: "Результатів немає", noResultsSub: "Спробуйте інші ключові слова або фільтри", startSearching: "Почніть пошук", startSearchingSub: "Шукайте за заголовком, тегом або вмістом" },
  add: { whatHappened: "Що сталося?", addDetails: "Додати деталі...", listening: "Слухаю..." },
  settings: { title: "Налаштування", sections: { security: "БЕЗПЕКА", privacy: "КОНФІДЕНЦІЙНІСТЬ", notifications: "СПОВІЩЕННЯ", recurringPrompts: "ПОВТОРЮВАНІ НАГАДУВАННЯ", appearance: "ЗОВНІШНІЙ ВИГЛЯД", language: "МОВА", social: "СОЦІАЛЬНІ МЕРЕЖІ", backup: "РЕЗЕРВНЕ КОПІЮВАННЯ", danger: "НЕБЕЗПЕЧНА ЗОНА" }, rows: { appLock: "Блокування додатку", biometric: "Біометричне розблокування", autoLock: "Автоблокування", decoyPin: "ПІН-приманка", guestPass: "Гостьовий доступ", localOnly: "Тільки локально", screenshot: "Захист від скріншотів", stripMetadata: "Видалити метадані фото", dailyReminder: "Щоденне нагадування", theme: "Тема", fontColor: "Колір шрифту", appLanguage: "Мова додатку", export: "Експорт резервної копії", encryptedExport: "Зашифрований експорт", import: "Імпорт резервної копії", generateCodes: "Створити коди відновлення", backupPassphrase: "Фраза резервного копіювання", wipeAll: "Видалити все", deleteAccount: "Видалити акаунт", signOut: "Вийти" }, language: { title: "Мова" }, appearance: { theme: "Тема", dark: "Темна", light: "Світла", system: "Системна" } },
  auth: { signIn: "Увійти", signUp: "Зареєструватися", email: "Ел. пошта", password: "Пароль", continueWithGoogle: "Продовжити з Google", continueWithApple: "Продовжити з Apple", noAccount: "Немає акаунту?", hasAccount: "Вже є акаунт?", guestPreview: "Продовжити як гість", verifyEmail: "Перевірте пошту на код підтвердження.", verifyCode: "Код підтвердження", verify: "Підтвердити" },
};

export const vi: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Dòng Thời Gian", search: "Tìm Kiếm", settings: "Cài Đặt" },
  common: { cancel: "Hủy", save: "Lưu", delete: "Xóa", generating: "Đang tạo...", today: "Hôm nay", yesterday: "Hôm qua", thisWeek: "Tuần này", lastWeek: "Tuần trước", ok: "OK", share: "Chia sẻ", tapForToday: "chạm để hôm nay", newEntry: "MỤC MỚI", result: "kết quả", results: "kết quả", error: "Có lỗi xảy ra. Vui lòng thử lại.", noEntriesYet: "Chưa có mục nào" },
  timeline: { emptyTitle: "Chưa có mục nào", emptySubtitle: "Bằng chứng cuộc sống của bạn sống ở đây.\nNhấn + để lưu mục đầu tiên.", noTagEntries: "Chưa có mục {{tag}} nào." },
  search: { title: "Tìm Kiếm", placeholder: "Tiêu đề, thẻ hoặc nội dung...", noResults: "Không tìm thấy kết quả", noResultsSub: "Thử các từ khóa hoặc bộ lọc khác", startSearching: "Bắt đầu tìm kiếm", startSearchingSub: "Tìm theo tiêu đề, thẻ hoặc nội dung" },
  add: { whatHappened: "Chuyện gì đã xảy ra?", addDetails: "Thêm chi tiết...", listening: "Đang nghe..." },
  settings: { title: "Cài Đặt", sections: { security: "BẢO MẬT", privacy: "QUYỀN RIÊNG TƯ", notifications: "THÔNG BÁO", recurringPrompts: "NHẮC NHỞ LẶP LẠI", appearance: "GIAO DIỆN", language: "NGÔN NGỮ", social: "MẠNG XÃ HỘI", backup: "SAO LƯU & PHỤC HỒI", danger: "VÙNG NGUY HIỂM" }, rows: { appLock: "Khóa Ứng Dụng", biometric: "Mở Khóa Sinh Trắc Học", autoLock: "Tự Động Khóa", decoyPin: "PIN Mồi Nhử", guestPass: "Thẻ Khách", localOnly: "Chỉ Cục Bộ", screenshot: "Bảo Vệ Ảnh Chụp Màn Hình", stripMetadata: "Xóa Metadata Ảnh", dailyReminder: "Nhắc Nhở Hàng Ngày", theme: "Chủ Đề", fontColor: "Màu Chữ", appLanguage: "Ngôn Ngữ Ứng Dụng", export: "Xuất Sao Lưu", encryptedExport: "Xuất Mã Hóa", import: "Nhập Sao Lưu", generateCodes: "Tạo Mã Phục Hồi", backupPassphrase: "Cụm Từ Sao Lưu", wipeAll: "Xóa Tất Cả", deleteAccount: "Xóa Tài Khoản", signOut: "Đăng Xuất" }, language: { title: "Ngôn Ngữ" }, appearance: { theme: "Chủ Đề", dark: "Tối", light: "Sáng", system: "Hệ Thống" } },
  auth: { signIn: "Đăng Nhập", signUp: "Đăng Ký", email: "Email", password: "Mật Khẩu", continueWithGoogle: "Tiếp tục với Google", continueWithApple: "Tiếp tục với Apple", noAccount: "Chưa có tài khoản?", hasAccount: "Đã có tài khoản?", guestPreview: "Tiếp tục với tư cách Khách", verifyEmail: "Kiểm tra email để lấy mã xác minh.", verifyCode: "Mã xác minh", verify: "Xác minh" },
};

export const th: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "ไทม์ไลน์", search: "ค้นหา", settings: "การตั้งค่า" },
  common: { cancel: "ยกเลิก", save: "บันทึก", delete: "ลบ", generating: "กำลังสร้าง...", today: "วันนี้", yesterday: "เมื่อวาน", thisWeek: "สัปดาห์นี้", lastWeek: "สัปดาห์ที่แล้ว", ok: "ตกลง", share: "แชร์", tapForToday: "แตะเพื่อวันนี้", newEntry: "รายการใหม่", result: "ผลลัพธ์", results: "ผลลัพธ์", error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง", noEntriesYet: "ยังไม่มีรายการ" },
  timeline: { emptyTitle: "ยังไม่มีรายการ", emptySubtitle: "หลักฐานชีวิตของคุณอยู่ที่นี่\nแตะ + เพื่อบันทึกรายการแรก", noTagEntries: "ยังไม่มีรายการ {{tag}}" },
  search: { title: "ค้นหา", placeholder: "ชื่อเรื่อง แท็ก หรือเนื้อหา...", noResults: "ไม่พบผลลัพธ์", noResultsSub: "ลองคำค้นหาหรือตัวกรองอื่น", startSearching: "เริ่มค้นหา", startSearchingSub: "ค้นหาตามชื่อเรื่อง แท็ก หรือเนื้อหา" },
  add: { whatHappened: "เกิดอะไรขึ้น?", addDetails: "เพิ่มรายละเอียด...", listening: "กำลังฟัง..." },
  settings: { title: "การตั้งค่า", sections: { security: "ความปลอดภัย", privacy: "ความเป็นส่วนตัว", notifications: "การแจ้งเตือน", recurringPrompts: "การเตือนซ้ำ", appearance: "รูปลักษณ์", language: "ภาษา", social: "โซเชียล", backup: "สำรองและกู้คืน", danger: "โซนอันตราย" }, rows: { appLock: "ล็อกแอป", biometric: "ปลดล็อกด้วยไบโอเมตริก", autoLock: "ล็อกอัตโนมัติ", decoyPin: "PIN หลอกลวง", guestPass: "บัตรผ่านแขก", localOnly: "เฉพาะในเครื่อง", screenshot: "ป้องกันภาพหน้าจอ", stripMetadata: "ลบข้อมูลเมตาภาพ", dailyReminder: "การเตือนประจำวัน", theme: "ธีม", fontColor: "สีฟอนต์", appLanguage: "ภาษาแอป", export: "ส่งออกข้อมูลสำรอง", encryptedExport: "ส่งออกแบบเข้ารหัส", import: "นำเข้าข้อมูลสำรอง", generateCodes: "สร้างรหัสกู้คืน", backupPassphrase: "รหัสผ่านสำรอง", wipeAll: "ลบทั้งหมด", deleteAccount: "ลบบัญชี", signOut: "ออกจากระบบ" }, language: { title: "ภาษา" }, appearance: { theme: "ธีม", dark: "มืด", light: "สว่าง", system: "ระบบ" } },
  auth: { signIn: "เข้าสู่ระบบ", signUp: "สมัครสมาชิก", email: "อีเมล", password: "รหัสผ่าน", continueWithGoogle: "ดำเนินการต่อด้วย Google", continueWithApple: "ดำเนินการต่อด้วย Apple", noAccount: "ยังไม่มีบัญชี?", hasAccount: "มีบัญชีอยู่แล้ว?", guestPreview: "ดำเนินการต่อในฐานะแขก", verifyEmail: "ตรวจสอบอีเมลของคุณเพื่อรับรหัสยืนยัน", verifyCode: "รหัสยืนยัน", verify: "ยืนยัน" },
};

export const he: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "ציר זמן", search: "חיפוש", settings: "הגדרות" },
  common: { cancel: "ביטול", save: "שמור", delete: "מחק", generating: "מייצר...", today: "היום", yesterday: "אתמול", thisWeek: "השבוע", lastWeek: "שבוע שעבר", ok: "אישור", share: "שתף", tapForToday: "הקש להיום", newEntry: "רשומה חדשה", result: "תוצאה", results: "תוצאות", error: "משהו השתבש. אנא נסה שוב.", noEntriesYet: "אין רשומות עדיין" },
  timeline: { emptyTitle: "אין רשומות עדיין", emptySubtitle: "הוכחות חייך חיות כאן.\nלחץ + כדי לשמור את הרשומה הראשונה.", noTagEntries: "אין רשומות {{tag}} עדיין." },
  search: { title: "חיפוש", placeholder: "כותרת, תג או תוכן...", noResults: "לא נמצאו תוצאות", noResultsSub: "נסה מילות מפתח או מסננים שונים", startSearching: "התחל לחפש", startSearchingSub: "חפש לפי כותרת, תג או תוכן" },
  add: { whatHappened: "מה קרה?", addDetails: "הוסף פרטים...", listening: "מאזין..." },
  settings: { title: "הגדרות", sections: { security: "אבטחה", privacy: "פרטיות", notifications: "התראות", recurringPrompts: "תזכורות חוזרות", appearance: "מראה", language: "שפה", social: "חברתי", backup: "גיבוי ושחזור", danger: "אזור סכנה" }, rows: { appLock: "נעילת אפליקציה", biometric: "פתיחה ביומטרית", autoLock: "נעילה אוטומטית", decoyPin: "פין מסווה", guestPass: "כרטיס אורח", localOnly: "מקומי בלבד", screenshot: "הגנת צילום מסך", stripMetadata: "הסר מטאדטה מתמונות", dailyReminder: "תזכורת יומית", theme: "ערכת נושא", fontColor: "צבע גופן", appLanguage: "שפת האפליקציה", export: "ייצוא גיבוי", encryptedExport: "ייצוא מוצפן", import: "ייבוא גיבוי", generateCodes: "ייצור קודי שחזור", backupPassphrase: "ביטוי סיסמה לגיבוי", wipeAll: "מחק הכל", deleteAccount: "מחק חשבון", signOut: "התנתק" }, language: { title: "שפה" }, appearance: { theme: "ערכת נושא", dark: "כהה", light: "בהיר", system: "מערכת" } },
  auth: { signIn: "התחבר", signUp: "הירשם", email: "דוא\"ל", password: "סיסמה", continueWithGoogle: "המשך עם Google", continueWithApple: "המשך עם Apple", noAccount: "אין לך חשבון?", hasAccount: "כבר יש לך חשבון?", guestPreview: "המשך כאורח", verifyEmail: "בדוק את הדוא\"ל שלך לקוד אימות.", verifyCode: "קוד אימות", verify: "אמת" },
};

export const ms: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Garis Masa", search: "Cari", settings: "Tetapan" },
  common: { cancel: "Batal", save: "Simpan", delete: "Padam", generating: "Menjana...", today: "Hari ini", yesterday: "Semalam", thisWeek: "Minggu Ini", lastWeek: "Minggu Lepas", ok: "OK", share: "Kongsi", tapForToday: "ketuk untuk hari ini", newEntry: "CATATAN BARU", result: "keputusan", results: "keputusan", error: "Sesuatu yang tidak betul berlaku. Sila cuba lagi.", noEntriesYet: "Tiada catatan lagi" },
  timeline: { emptyTitle: "Tiada catatan lagi", emptySubtitle: "Bukti kehidupan anda ada di sini.\nKetuk + untuk menyimpan catatan pertama.", noTagEntries: "Tiada catatan {{tag}} lagi." },
  search: { title: "Cari", placeholder: "Tajuk, tag atau kandungan...", noResults: "Tiada keputusan dijumpai", noResultsSub: "Cuba kata kunci atau penapis yang berbeza", startSearching: "Mula mencari", startSearchingSub: "Cari mengikut tajuk, tag atau kandungan" },
  add: { whatHappened: "Apa yang berlaku?", addDetails: "Tambah butiran...", listening: "Mendengar..." },
  settings: { title: "Tetapan", sections: { security: "KESELAMATAN", privacy: "PRIVASI", notifications: "PEMBERITAHUAN", recurringPrompts: "PERINGATAN BERULANG", appearance: "RUPA", language: "BAHASA", social: "SOSIAL", backup: "SANDARAN & PULIHKAN", danger: "ZON BAHAYA" }, rows: { appLock: "Kunci Apl", biometric: "Buka Kunci Biometrik", autoLock: "Kunci Auto", decoyPin: "PIN Umpan", guestPass: "Pas Tetamu", localOnly: "Tempatan Sahaja", screenshot: "Perlindungan Tangkapan Skrin", stripMetadata: "Buang Metadata Foto", dailyReminder: "Peringatan Harian", theme: "Tema", fontColor: "Warna Fon", appLanguage: "Bahasa Apl", export: "Eksport Sandaran", encryptedExport: "Eksport Disulitkan", import: "Import Sandaran", generateCodes: "Jana Kod Pemulihan", backupPassphrase: "Frasa Laluan Sandaran", wipeAll: "Padam Semua", deleteAccount: "Padam Akaun", signOut: "Log Keluar" }, language: { title: "Bahasa" }, appearance: { theme: "Tema", dark: "Gelap", light: "Terang", system: "Sistem" } },
  auth: { signIn: "Log Masuk", signUp: "Daftar", email: "E-mel", password: "Kata Laluan", continueWithGoogle: "Teruskan dengan Google", continueWithApple: "Teruskan dengan Apple", noAccount: "Tiada akaun?", hasAccount: "Sudah ada akaun?", guestPreview: "Teruskan sebagai Tetamu", verifyEmail: "Semak e-mel anda untuk kod pengesahan.", verifyCode: "Kod pengesahan", verify: "Sahkan" },
};

export const cs: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Časová osa", search: "Hledat", settings: "Nastavení" },
  common: { cancel: "Zrušit", save: "Uložit", delete: "Smazat", generating: "Generování...", today: "Dnes", yesterday: "Včera", thisWeek: "Tento týden", lastWeek: "Minulý týden", ok: "OK", share: "Sdílet", tapForToday: "klepněte pro dnes", newEntry: "NOVÝ ZÁZNAM", result: "výsledek", results: "výsledky", error: "Něco se pokazilo. Zkuste to znovu.", noEntriesYet: "Zatím žádné záznamy" },
  timeline: { emptyTitle: "Zatím žádné záznamy", emptySubtitle: "Důkazy vašeho života žijí zde.\nKlepněte na + pro uložení prvního záznamu.", noTagEntries: "Zatím žádné záznamy {{tag}}." },
  search: { title: "Hledat", placeholder: "Název, štítek nebo obsah...", noResults: "Žádné výsledky", noResultsSub: "Zkuste jiná klíčová slova nebo filtry", startSearching: "Začněte hledat", startSearchingSub: "Hledejte podle názvu, štítku nebo obsahu" },
  add: { whatHappened: "Co se stalo?", addDetails: "Přidat podrobnosti...", listening: "Poslouchám..." },
  settings: { title: "Nastavení", sections: { security: "ZABEZPEČENÍ", privacy: "SOUKROMÍ", notifications: "OZNÁMENÍ", recurringPrompts: "OPAKUJÍCÍ SE PŘIPOMÍNKY", appearance: "VZHLED", language: "JAZYK", social: "SOCIÁLNÍ", backup: "ZÁLOHA A OBNOVENÍ", danger: "NEBEZPEČNÁ ZÓNA" }, rows: { appLock: "Zámek aplikace", biometric: "Biometrické odemčení", autoLock: "Automatický zámek", decoyPin: "Návnadový PIN", guestPass: "Hostovský přístup", localOnly: "Pouze lokálně", screenshot: "Ochrana snímků obrazovky", stripMetadata: "Odstranit metadata fotek", dailyReminder: "Denní připomínka", theme: "Téma", fontColor: "Barva písma", appLanguage: "Jazyk aplikace", export: "Exportovat zálohu", encryptedExport: "Šifrovaný export", import: "Importovat zálohu", generateCodes: "Generovat kódy pro obnovení", backupPassphrase: "Heslo pro zálohu", wipeAll: "Smazat vše", deleteAccount: "Smazat účet", signOut: "Odhlásit se" }, language: { title: "Jazyk" }, appearance: { theme: "Téma", dark: "Tmavé", light: "Světlé", system: "Systémové" } },
  auth: { signIn: "Přihlásit se", signUp: "Registrovat se", email: "E-mail", password: "Heslo", continueWithGoogle: "Pokračovat s Google", continueWithApple: "Pokračovat s Apple", noAccount: "Nemáte účet?", hasAccount: "Máte již účet?", guestPreview: "Pokračovat jako host", verifyEmail: "Zkontrolujte e-mail pro ověřovací kód.", verifyCode: "Ověřovací kód", verify: "Ověřit" },
};

export const ro: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Cronologie", search: "Căutare", settings: "Setări" },
  common: { cancel: "Anulare", save: "Salvare", delete: "Ștergere", generating: "Generare...", today: "Azi", yesterday: "Ieri", thisWeek: "Săptămâna Aceasta", lastWeek: "Săptămâna Trecută", ok: "OK", share: "Partajare", tapForToday: "atinge pentru azi", newEntry: "INTRARE NOUĂ", result: "rezultat", results: "rezultate", error: "Ceva a mers greșit. Te rugăm să încerci din nou.", noEntriesYet: "Nicio intrare încă" },
  timeline: { emptyTitle: "Nicio intrare încă", emptySubtitle: "Dovada vieții tale trăiește aici.\nAtinge + pentru a salva prima intrare.", noTagEntries: "Nicio intrare {{tag}} încă." },
  search: { title: "Căutare", placeholder: "Titlu, etichetă sau conținut...", noResults: "Niciun rezultat găsit", noResultsSub: "Încearcă alte cuvinte cheie sau filtre", startSearching: "Începe căutarea", startSearchingSub: "Caută după titlu, etichetă sau conținut" },
  add: { whatHappened: "Ce s-a întâmplat?", addDetails: "Adaugă detalii...", listening: "Ascultare..." },
  settings: { title: "Setări", sections: { security: "SECURITATE", privacy: "CONFIDENȚIALITATE", notifications: "NOTIFICĂRI", recurringPrompts: "MEMENTO-URI RECURENTE", appearance: "ASPECT", language: "LIMBĂ", social: "SOCIAL", backup: "BACKUP & RESTAURARE", danger: "ZONĂ DE PERICOL" }, rows: { appLock: "Blocare Aplicație", biometric: "Deblocare Biometrică", autoLock: "Blocare Automată", decoyPin: "PIN Momeală", guestPass: "Acces Oaspete", localOnly: "Doar Local", screenshot: "Protecție Capturi de Ecran", stripMetadata: "Elimină Metadatele Foto", dailyReminder: "Memento Zilnic", theme: "Temă", fontColor: "Culoarea Fontului", appLanguage: "Limbă Aplicație", export: "Exportare Backup", encryptedExport: "Export Criptat", import: "Importare Backup", generateCodes: "Generează Coduri de Recuperare", backupPassphrase: "Parolă de Backup", wipeAll: "Șterge Tot", deleteAccount: "Șterge Cont", signOut: "Deconectare" }, language: { title: "Limbă" }, appearance: { theme: "Temă", dark: "Întunecat", light: "Luminos", system: "Sistem" } },
  auth: { signIn: "Autentificare", signUp: "Înregistrare", email: "E-mail", password: "Parolă", continueWithGoogle: "Continuă cu Google", continueWithApple: "Continuă cu Apple", noAccount: "Nu ai cont?", hasAccount: "Ai deja cont?", guestPreview: "Continuă ca Oaspete", verifyEmail: "Verifică e-mailul pentru un cod de verificare.", verifyCode: "Cod de verificare", verify: "Verifică" },
};

export const hu: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Idősor", search: "Keresés", settings: "Beállítások" },
  common: { cancel: "Mégse", save: "Mentés", delete: "Törlés", generating: "Generálás...", today: "Ma", yesterday: "Tegnap", thisWeek: "Ezen a héten", lastWeek: "Múlt héten", ok: "OK", share: "Megosztás", tapForToday: "érintsd meg a maiért", newEntry: "ÚJ BEJEGYZÉS", result: "eredmény", results: "eredmény", error: "Valami rosszul sült el. Kérjük próbálja újra.", noEntriesYet: "Még nincs bejegyzés" },
  timeline: { emptyTitle: "Még nincs bejegyzés", emptySubtitle: "Az életed bizonyítékai itt élnek.\nKoppints a + gombra az első bejegyzés mentéséhez.", noTagEntries: "Még nincs {{tag}} bejegyzés." },
  search: { title: "Keresés", placeholder: "Cím, címke vagy tartalom...", noResults: "Nincs találat", noResultsSub: "Próbáljon más kulcsszavakat vagy szűrőket", startSearching: "Kezdj el keresni", startSearchingSub: "Keressen cím, tag vagy tartalom alapján" },
  add: { whatHappened: "Mi történt?", addDetails: "Részletek hozzáadása...", listening: "Hallgatás..." },
  settings: { title: "Beállítások", sections: { security: "BIZTONSÁG", privacy: "ADATVÉDELEM", notifications: "ÉRTESÍTÉSEK", recurringPrompts: "ISMÉTLŐDŐ EMLÉKEZTETŐK", appearance: "MEGJELENÉS", language: "NYELV", social: "KÖZÖSSÉGI", backup: "BIZTONSÁGI MENTÉS", danger: "VESZÉLYES ZÓNA" }, rows: { appLock: "Alkalmazászár", biometric: "Biometrikus feloldás", autoLock: "Automatikus zár", decoyPin: "Csali PIN", guestPass: "Vendég hozzáférés", localOnly: "Csak helyi", screenshot: "Képernyőkép védelem", stripMetadata: "Fotó metaadatok eltávolítása", dailyReminder: "Napi emlékeztető", theme: "Téma", fontColor: "Betűszín", appLanguage: "Alkalmazás nyelve", export: "Biztonsági mentés exportálása", encryptedExport: "Titkosított exportálás", import: "Biztonsági mentés importálása", generateCodes: "Helyreállítási kódok létrehozása", backupPassphrase: "Biztonsági mentési jelszó", wipeAll: "Összes törlése", deleteAccount: "Fiók törlése", signOut: "Kijelentkezés" }, language: { title: "Nyelv" }, appearance: { theme: "Téma", dark: "Sötét", light: "Világos", system: "Rendszer" } },
  auth: { signIn: "Bejelentkezés", signUp: "Regisztráció", email: "E-mail", password: "Jelszó", continueWithGoogle: "Folytatás Google-lal", continueWithApple: "Folytatás Apple-lel", noAccount: "Nincs fiókod?", hasAccount: "Már van fiókod?", guestPreview: "Folytatás vendégként", verifyEmail: "Ellenőrizd az e-mailedet egy ellenőrző kódért.", verifyCode: "Ellenőrző kód", verify: "Hitelesítés" },
};

export const fi: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Aikajana", search: "Haku", settings: "Asetukset" },
  common: { cancel: "Peruuta", save: "Tallenna", delete: "Poista", generating: "Luodaan...", today: "Tänään", yesterday: "Eilen", thisWeek: "Tällä viikolla", lastWeek: "Viime viikolla", ok: "OK", share: "Jaa", tapForToday: "napauta tänään", newEntry: "UUSI MERKINTÄ", result: "tulos", results: "tuloksia", error: "Jotain meni pieleen. Yritä uudelleen.", noEntriesYet: "Ei merkintöjä vielä" },
  timeline: { emptyTitle: "Ei merkintöjä vielä", emptySubtitle: "Elämäsi todisteet elävät täällä.\nNapauta + tallentaaksesi ensimmäisen merkinnän.", noTagEntries: "Ei {{tag}}-merkintöjä vielä." },
  search: { title: "Haku", placeholder: "Otsikko, tunniste tai sisältö...", noResults: "Ei tuloksia", noResultsSub: "Kokeile eri hakusanoja tai suodattimia", startSearching: "Aloita hakeminen", startSearchingSub: "Hae otsikon, tunnisteen tai sisällön mukaan" },
  add: { whatHappened: "Mitä tapahtui?", addDetails: "Lisää tietoja...", listening: "Kuunnellaan..." },
  settings: { title: "Asetukset", sections: { security: "TURVALLISUUS", privacy: "TIETOSUOJA", notifications: "ILMOITUKSET", recurringPrompts: "TOISTUVAT MUISTUTUKSET", appearance: "ULKOASU", language: "KIELI", social: "SOSIAALINEN", backup: "VARMUUSKOPIO & PALAUTUS", danger: "VAARALLINEN ALUE" }, rows: { appLock: "Sovelluksen lukitus", biometric: "Biometrinen avaus", autoLock: "Automaattinen lukitus", decoyPin: "Houkutin-PIN", guestPass: "Vieraspass", localOnly: "Vain paikallinen", screenshot: "Kuvakaappaussuojaus", stripMetadata: "Poista kuvan metatiedot", dailyReminder: "Päivittäinen muistutus", theme: "Teema", fontColor: "Fontin väri", appLanguage: "Sovelluksen kieli", export: "Vie varmuuskopio", encryptedExport: "Salattu vienti", import: "Tuo varmuuskopio", generateCodes: "Luo palautuskoodit", backupPassphrase: "Varmuuskopion salasanalause", wipeAll: "Poista kaikki", deleteAccount: "Poista tili", signOut: "Kirjaudu ulos" }, language: { title: "Kieli" }, appearance: { theme: "Teema", dark: "Tumma", light: "Vaalea", system: "Järjestelmä" } },
  auth: { signIn: "Kirjaudu sisään", signUp: "Rekisteröidy", email: "Sähköposti", password: "Salasana", continueWithGoogle: "Jatka Googlen kautta", continueWithApple: "Jatka Applen kautta", noAccount: "Ei tiliä?", hasAccount: "Onko sinulla jo tili?", guestPreview: "Jatka vieraana", verifyEmail: "Tarkista sähköpostisi vahvistuskoodia varten.", verifyCode: "Vahvistuskoodi", verify: "Vahvista" },
};

export const am: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "የጊዜ መስመር", search: "ፈልግ", settings: "ቅንብሮች" },
  common: { cancel: "ሰርዝ", save: "አስቀምጥ", delete: "ሰርዝ", generating: "በመፍጠር ላይ...", today: "ዛሬ", yesterday: "ትናንት", thisWeek: "ይህ ሳምንት", lastWeek: "ያለፈው ሳምንት", ok: "እሺ", share: "አጋራ", tapForToday: "ዛሬ ለመክፈት ነካ ያድርጉ", newEntry: "አዲስ ግቤት", result: "ውጤት", results: "ውጤቶች", error: "የሆነ ስህተት ተፈጥሯል። እባኮትን እንደገና ይሞክሩ።", noEntriesYet: "እስካሁን ምንም ግቤቶች የሉም" },
  timeline: { emptyTitle: "እስካሁን ምንም ግቤቶች የሉም", emptySubtitle: "የሕይወትዎ ማስረጃ እዚህ ይኖራል።\nየመጀመሪያ ግቤትዎን ለማስቀመጥ + ን ይጫኑ።", noTagEntries: "እስካሁን {{tag}} ግቤቶች የሉም።" },
  search: { title: "ፈልግ", placeholder: "ርዕስ፣ ታጅ ወይም ይዘት...", noResults: "ምንም ውጤቶች አልተገኙም", noResultsSub: "የተለያዩ ቁልፍ ቃላት ወይም ማጣሪያዎችን ሞክር", startSearching: "መፈለግ ጀምር", startSearchingSub: "በርዕስ፣ ታጅ ወይም ይዘት ፈልግ" },
  add: { whatHappened: "ምን ሆነ?", addDetails: "ዝርዝሮችን ያክሉ...", listening: "በማዳመጥ ላይ..." },
  settings: { title: "ቅንብሮች", sections: { security: "ደህንነት", privacy: "ግላዊነት", notifications: "ማሳወቂያዎች", recurringPrompts: "ተደጋጋሚ ማስታወሻዎች", appearance: "መልክ", language: "ቋንቋ", social: "ማህበራዊ", backup: "ምትኬ & ወደነበረበት መመለስ", danger: "አደገኛ ቦታ" }, rows: { appLock: "ፕሮግራም ቆልፍ", biometric: "ባዮሜትሪክ ቆልፍ ፍቺ", autoLock: "ራስ-ቆልፍ", decoyPin: "የፍንጥያ ፒን", guestPass: "የእንግዳ ፍቃድ", localOnly: "ሀገር-አቀፍ ብቻ", screenshot: "ቅጂ ምስል ጥበቃ", stripMetadata: "የፎቶ ሜታዳታ አስወግድ", dailyReminder: "ዕለታዊ ማስታወሻ", theme: "ጭብጥ", fontColor: "የቅርጸ-ቁምፊ ቀለም", appLanguage: "የፕሮግራም ቋንቋ", export: "ምትኬ ላክ", encryptedExport: "ምስጠራ ላክ", import: "ምትኬ አምጣ", generateCodes: "የማገገሚያ ኮዶች ፍጠር", backupPassphrase: "የምትኬ አነጋጋሪ ሐረግ", wipeAll: "ሁሉንም ሰርዝ", deleteAccount: "መለያ ሰርዝ", signOut: "ውጣ" }, language: { title: "ቋንቋ" }, appearance: { theme: "ጭብጥ", dark: "ጨለማ", light: "ብርሃን", system: "ስርዓት" } },
  auth: { signIn: "ግባ", signUp: "ተመዝገብ", email: "ኢሜይል", password: "የምስጢር ቁልፍ", continueWithGoogle: "በGoogle ቀጥል", continueWithApple: "በApple ቀጥል", noAccount: "መለያ የለህም?", hasAccount: "መለያ አለህ?", guestPreview: "እንደ እንግዳ ቀጥል", verifyEmail: "ኢሜይልህን ለማረጋገጫ ኮድ ፈትሽ።", verifyCode: "ማረጋገጫ ኮድ", verify: "አረጋግጥ" },
};

export const sw: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Mstari wa Wakati", search: "Tafuta", settings: "Mipangilio" },
  common: { cancel: "Ghairi", save: "Hifadhi", delete: "Futa", generating: "Inaunda...", today: "Leo", yesterday: "Jana", thisWeek: "Wiki Hii", lastWeek: "Wiki Iliyopita", ok: "Sawa", share: "Shiriki", tapForToday: "gonga kwa leo", newEntry: "INGIZO JIPYA", result: "matokeo", results: "matokeo", error: "Kitu kimekwenda vibaya. Tafadhali jaribu tena.", noEntriesYet: "Hakuna maingizo bado" },
  timeline: { emptyTitle: "Hakuna maingizo bado", emptySubtitle: "Ushahidi wa maisha yako unaishi hapa.\nGonga + kuokoa ingizo lako la kwanza.", noTagEntries: "Hakuna maingizo ya {{tag}} bado." },
  search: { title: "Tafuta", placeholder: "Kichwa, tagi, au maudhui...", noResults: "Hakuna matokeo", noResultsSub: "Jaribu maneno tofauti au vichungi", startSearching: "Anza kutafuta", startSearchingSub: "Tafuta kwa kichwa, tagi, au maudhui" },
  add: { whatHappened: "Nini kilitokea?", addDetails: "Ongeza maelezo...", listening: "Inasikiliza..." },
  settings: { title: "Mipangilio", sections: { security: "USALAMA", privacy: "FARAGHA", notifications: "ARIFA", recurringPrompts: "VIKUMBUSHA VYA MARA KWA MARA", appearance: "MWONEKANO", language: "LUGHA", social: "KIJAMII", backup: "NAKALA HIFADHI & UREJESHO", danger: "ENEO LA HATARI" }, rows: { appLock: "Kufunga Programu", biometric: "Kufungua kwa Biometriki", autoLock: "Kufunga Otomatiki", decoyPin: "PIN ya Udanganyifu", guestPass: "Hati ya Mgeni", localOnly: "Mtandao wa Ndani Tu", screenshot: "Ulinzi wa Picha ya Skrini", stripMetadata: "Ondoa Metadata ya Picha", dailyReminder: "Kikumbusha cha Kila Siku", theme: "Mandhari", fontColor: "Rangi ya Herufi", appLanguage: "Lugha ya Programu", export: "Hamisha Nakala Hifadhi", encryptedExport: "Hamisha Iliyosimbwa", import: "Ingiza Nakala Hifadhi", generateCodes: "Tengeneza Nambari za Kurejesha", backupPassphrase: "Neno la Siri la Nakala Hifadhi", wipeAll: "Futa Yote", deleteAccount: "Futa Akaunti", signOut: "Toka" }, language: { title: "Lugha" }, appearance: { theme: "Mandhari", dark: "Giza", light: "Mwanga", system: "Mfumo" } },
  auth: { signIn: "Ingia", signUp: "Jisajili", email: "Barua pepe", password: "Neno la siri", continueWithGoogle: "Endelea na Google", continueWithApple: "Endelea na Apple", noAccount: "Huna akaunti?", hasAccount: "Una akaunti tayari?", guestPreview: "Endelea kama mgeni", verifyEmail: "Angalia barua pepe yako kwa nambari ya uthibitishaji.", verifyCode: "Nambari ya uthibitishaji", verify: "Thibitisha" },
};

export const af: DeepPartial<TranslationKeys> = {
  tabs: { timeline: "Tydlyn", search: "Soek", settings: "Instellings" },
  common: { cancel: "Kanselleer", save: "Stoor", delete: "Verwyder", generating: "Genereer...", today: "Vandag", yesterday: "Gister", thisWeek: "Hierdie Week", lastWeek: "Verlede Week", ok: "OK", share: "Deel", tapForToday: "tik vir vandag", newEntry: "NUWE INSKRYWING", result: "resultaat", results: "resultate", error: "Iets het verkeerd gegaan. Probeer asseblief weer.", noEntriesYet: "Nog geen inskrywings nie" },
  timeline: { emptyTitle: "Nog geen inskrywings nie", emptySubtitle: "Jou lewensbewyse woon hier.\nTik + om jou eerste inskrywing te stoor.", noTagEntries: "Nog geen {{tag}} inskrywings nie." },
  search: { title: "Soek", placeholder: "Titel, etiket of inhoud...", noResults: "Geen resultate gevind nie", noResultsSub: "Probeer verskillende sleutelwoorde of filters", startSearching: "Begin soek", startSearchingSub: "Soek op titel, etiket of inhoud" },
  add: { whatHappened: "Wat het gebeur?", addDetails: "Voeg besonderhede by...", listening: "Luister..." },
  settings: { title: "Instellings", sections: { security: "SEKURITEIT", privacy: "PRIVAATHEID", notifications: "KENNISGEWINGS", recurringPrompts: "HERHALENDE HERINNERINGE", appearance: "VOORKOMS", language: "TAAL", social: "SOSIAAL", backup: "RUGSTEUN & HERSTEL", danger: "GEVAARZONE" }, rows: { appLock: "Appslot", biometric: "Biometriese Ontsluit", autoLock: "Outo-Slot", decoyPin: "Lokval-PIN", guestPass: "Gaste-Pas", localOnly: "Slegs Plaaslik", screenshot: "Skermkiekiebeskerming", stripMetadata: "Verwyder Fotometadata", dailyReminder: "Daaglikse Herinnering", theme: "Tema", fontColor: "Lettertipekleur", appLanguage: "App-Taal", export: "Voer Rugsteun Uit", encryptedExport: "Versleutelde Uitvoer", import: "Voer Rugsteun In", generateCodes: "Genereer Herstelkodes", backupPassphrase: "Rugsteun-Wagwoordfrase", wipeAll: "Vee Alles Uit", deleteAccount: "Vee Rekening Uit", signOut: "Teken Uit" }, language: { title: "Taal" }, appearance: { theme: "Tema", dark: "Donker", light: "Lig", system: "Stelsel" } },
  auth: { signIn: "Meld aan", signUp: "Registreer", email: "E-pos", password: "Wagwoord", continueWithGoogle: "Gaan voort met Google", continueWithApple: "Gaan voort met Apple", noAccount: "Het jy nie 'n rekening nie?", hasAccount: "Het jy reeds 'n rekening?", guestPreview: "Gaan voort as gaste", verifyEmail: "Kyk jou e-pos vir 'n verifikasiekode.", verifyCode: "Verifikasiekode", verify: "Bevestig" },
};

const translationMap: Record<string, DeepPartial<TranslationKeys>> = {
  en, es, fr, de, pt, it, ja, ko, zh, ar, hi, ru, tr, nl, pl, sv, id, uk, vi, th, he, ms, cs, ro, hu, fi, am, sw, af,
};

export function getTranslations(lang: string): TranslationKeys {
  const partial = translationMap[lang];
  if (!partial) return en;
  return deepMerge(en, partial);
}

export const SUPPORTED_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  { label: "Português", value: "pt" },
  { label: "Italiano", value: "it" },
  { label: "日本語", value: "ja" },
  { label: "한국어", value: "ko" },
  { label: "中文", value: "zh" },
  { label: "العربية", value: "ar" },
  { label: "हिन्दी", value: "hi" },
  { label: "Русский", value: "ru" },
  { label: "Türkçe", value: "tr" },
  { label: "Nederlands", value: "nl" },
  { label: "Polski", value: "pl" },
  { label: "Svenska", value: "sv" },
  { label: "Bahasa Indonesia", value: "id" },
  { label: "Українська", value: "uk" },
  { label: "Tiếng Việt", value: "vi" },
  { label: "ภาษาไทย", value: "th" },
  { label: "עברית", value: "he" },
  { label: "Bahasa Melayu", value: "ms" },
  { label: "Čeština", value: "cs" },
  { label: "Română", value: "ro" },
  { label: "Magyar", value: "hu" },
  { label: "Suomi", value: "fi" },
  { label: "አማርኛ", value: "am" },
  { label: "Kiswahili", value: "sw" },
  { label: "Afrikaans", value: "af" },
];
