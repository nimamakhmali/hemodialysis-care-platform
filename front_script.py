#!/usr/bin/env python3
"""
اسکریپت ایجاد ساختار پروژه فرانت‌اند سامانه همودیالیز
اجرا: python create_frontend_structure.py
"""

import os
import sys
from pathlib import Path


def create_file(path: Path, content: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def create_structure(base_path: Path) -> None:

    placeholder = "// TODO: implement\n"
    css_placeholder = "/* TODO: implement */\n"

    structure = {

        # ─── public ───────────────────────────────────────────────────────────
        "public/fonts/Vazirmatn/.gitkeep": "",
        "public/icons/favicon.ico": "",
        "public/images/logo.svg": (
            '<svg xmlns="http://www.w3.org/2000/svg" '
            'viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" '
            'fill="#0EA5E9"/></svg>\n'
        ),

        # ─── src/app ──────────────────────────────────────────────────────────
        "src/app/(auth)/login/page.tsx": placeholder,
        "src/app/(auth)/layout.tsx": placeholder,

        "src/app/(dashboard)/layout.tsx": placeholder,

        "src/app/(dashboard)/clinician/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/new/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/sessions/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/sessions/new/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/labs/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/labs/new/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/patients/[id]/timeline/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/alerts/page.tsx": placeholder,
        "src/app/(dashboard)/clinician/recommendations/page.tsx": placeholder,

        "src/app/(dashboard)/patient/page.tsx": placeholder,
        "src/app/(dashboard)/patient/symptoms/page.tsx": placeholder,
        "src/app/(dashboard)/patient/fluid/page.tsx": placeholder,
        "src/app/(dashboard)/patient/diet/page.tsx": placeholder,
        "src/app/(dashboard)/patient/messages/page.tsx": placeholder,
        "src/app/(dashboard)/patient/education/page.tsx": placeholder,
        "src/app/(dashboard)/patient/education/[topic]/page.tsx": placeholder,

        "src/app/(dashboard)/admin/page.tsx": placeholder,
        "src/app/(dashboard)/admin/users/page.tsx": placeholder,
        "src/app/(dashboard)/admin/users/[id]/page.tsx": placeholder,
        "src/app/(dashboard)/admin/education/page.tsx": placeholder,
        "src/app/(dashboard)/admin/education/[id]/page.tsx": placeholder,
        "src/app/(dashboard)/admin/audit-logs/page.tsx": placeholder,

        "src/app/api/[...path]/route.ts": placeholder,

        "src/app/globals.css": css_placeholder,
        "src/app/layout.tsx": placeholder,
        "src/app/not-found.tsx": placeholder,

        # ─── features/auth ────────────────────────────────────────────────────
        "src/features/auth/components/LoginForm.tsx": placeholder,
        "src/features/auth/components/ChangePasswordForm.tsx": placeholder,
        "src/features/auth/hooks/useAuth.ts": placeholder,
        "src/features/auth/services/auth.service.ts": placeholder,
        "src/features/auth/stores/auth.store.ts": placeholder,
        "src/features/auth/types/auth.types.ts": placeholder,
        "src/features/auth/index.ts": placeholder,

        # ─── features/patients ────────────────────────────────────────────────
        "src/features/patients/components/PatientCard.tsx": placeholder,
        "src/features/patients/components/PatientList.tsx": placeholder,
        "src/features/patients/components/PatientForm.tsx": placeholder,
        "src/features/patients/components/PatientProfile.tsx": placeholder,
        "src/features/patients/components/PatientSummaryCard.tsx": placeholder,
        "src/features/patients/components/PatientSearchBar.tsx": placeholder,
        "src/features/patients/components/PatientStatusBadge.tsx": placeholder,
        "src/features/patients/hooks/usePatients.ts": placeholder,
        "src/features/patients/hooks/usePatient.ts": placeholder,
        "src/features/patients/hooks/usePatientSummary.ts": placeholder,
        "src/features/patients/services/patients.service.ts": placeholder,
        "src/features/patients/types/patient.types.ts": placeholder,
        "src/features/patients/index.ts": placeholder,

        # ─── features/dialysis-sessions ───────────────────────────────────────
        "src/features/dialysis-sessions/components/SessionForm.tsx": placeholder,
        "src/features/dialysis-sessions/components/SessionCard.tsx": placeholder,
        "src/features/dialysis-sessions/components/SessionList.tsx": placeholder,
        "src/features/dialysis-sessions/components/SessionDetail.tsx": placeholder,
        "src/features/dialysis-sessions/components/WeightTrendChart.tsx": placeholder,
        "src/features/dialysis-sessions/components/BPTrendChart.tsx": placeholder,
        "src/features/dialysis-sessions/components/SessionEventBadge.tsx": placeholder,
        "src/features/dialysis-sessions/hooks/useSessions.ts": placeholder,
        "src/features/dialysis-sessions/hooks/useWeightTrend.ts": placeholder,
        "src/features/dialysis-sessions/hooks/useBPTrend.ts": placeholder,
        "src/features/dialysis-sessions/services/sessions.service.ts": placeholder,
        "src/features/dialysis-sessions/types/session.types.ts": placeholder,
        "src/features/dialysis-sessions/index.ts": placeholder,

        # ─── features/lab-results ─────────────────────────────────────────────
        "src/features/lab-results/components/LabPanelForm.tsx": placeholder,
        "src/features/lab-results/components/LabResultCard.tsx": placeholder,
        "src/features/lab-results/components/LabSummaryGrid.tsx": placeholder,
        "src/features/lab-results/components/LabTrendChart.tsx": placeholder,
        "src/features/lab-results/components/LabHistoryTable.tsx": placeholder,
        "src/features/lab-results/components/LabStatusIndicator.tsx": placeholder,
        "src/features/lab-results/hooks/useLabResults.ts": placeholder,
        "src/features/lab-results/hooks/useLatestLabs.ts": placeholder,
        "src/features/lab-results/hooks/useLabTrend.ts": placeholder,
        "src/features/lab-results/services/labs.service.ts": placeholder,
        "src/features/lab-results/types/lab.types.ts": placeholder,
        "src/features/lab-results/index.ts": placeholder,

        # ─── features/symptoms ────────────────────────────────────────────────
        "src/features/symptoms/components/SymptomChecklist.tsx": placeholder,
        "src/features/symptoms/components/SymptomReportForm.tsx": placeholder,
        "src/features/symptoms/components/SymptomHistoryList.tsx": placeholder,
        "src/features/symptoms/components/SymptomFrequencyChart.tsx": placeholder,
        "src/features/symptoms/hooks/useSymptoms.ts": placeholder,
        "src/features/symptoms/services/symptoms.service.ts": placeholder,
        "src/features/symptoms/types/symptom.types.ts": placeholder,
        "src/features/symptoms/index.ts": placeholder,

        # ─── features/fluid-diet ──────────────────────────────────────────────
        "src/features/fluid-diet/components/FluidIntakeForm.tsx": placeholder,
        "src/features/fluid-diet/components/FluidProgressBar.tsx": placeholder,
        "src/features/fluid-diet/components/DietAdherenceForm.tsx": placeholder,
        "src/features/fluid-diet/components/DietAdherenceCard.tsx": placeholder,
        "src/features/fluid-diet/components/FluidHistoryChart.tsx": placeholder,
        "src/features/fluid-diet/hooks/useFluidLog.ts": placeholder,
        "src/features/fluid-diet/hooks/useDietLog.ts": placeholder,
        "src/features/fluid-diet/services/fluid.service.ts": placeholder,
        "src/features/fluid-diet/services/diet.service.ts": placeholder,
        "src/features/fluid-diet/types/fluid-diet.types.ts": placeholder,
        "src/features/fluid-diet/index.ts": placeholder,

        # ─── features/alerts ──────────────────────────────────────────────────
        "src/features/alerts/components/AlertCard.tsx": placeholder,
        "src/features/alerts/components/AlertFeed.tsx": placeholder,
        "src/features/alerts/components/AlertBadge.tsx": placeholder,
        "src/features/alerts/components/AlertSeverityIcon.tsx": placeholder,
        "src/features/alerts/components/AlertActionButtons.tsx": placeholder,
        "src/features/alerts/hooks/useAlerts.ts": placeholder,
        "src/features/alerts/hooks/usePatientAlerts.ts": placeholder,
        "src/features/alerts/services/alerts.service.ts": placeholder,
        "src/features/alerts/types/alert.types.ts": placeholder,
        "src/features/alerts/index.ts": placeholder,

        # ─── features/recommendations ─────────────────────────────────────────
        "src/features/recommendations/components/RecommendationCard.tsx": placeholder,
        "src/features/recommendations/components/RecommendationReviewModal.tsx": placeholder,
        "src/features/recommendations/components/PendingRecommendationsList.tsx": placeholder,
        "src/features/recommendations/components/RecommendationStatusBadge.tsx": placeholder,
        "src/features/recommendations/hooks/useRecommendations.ts": placeholder,
        "src/features/recommendations/services/recommendations.service.ts": placeholder,
        "src/features/recommendations/types/recommendation.types.ts": placeholder,
        "src/features/recommendations/index.ts": placeholder,

        # ─── features/messages ────────────────────────────────────────────────
        "src/features/messages/components/MessageCard.tsx": placeholder,
        "src/features/messages/components/MessageList.tsx": placeholder,
        "src/features/messages/components/UnreadBadge.tsx": placeholder,
        "src/features/messages/hooks/useMessages.ts": placeholder,
        "src/features/messages/services/messages.service.ts": placeholder,
        "src/features/messages/types/message.types.ts": placeholder,
        "src/features/messages/index.ts": placeholder,

        # ─── features/education ───────────────────────────────────────────────
        "src/features/education/components/EducationCard.tsx": placeholder,
        "src/features/education/components/EducationContent.tsx": placeholder,
        "src/features/education/components/RelevantEducationList.tsx": placeholder,
        "src/features/education/components/EducationForm.tsx": placeholder,
        "src/features/education/hooks/useEducation.ts": placeholder,
        "src/features/education/services/education.service.ts": placeholder,
        "src/features/education/types/education.types.ts": placeholder,
        "src/features/education/index.ts": placeholder,

        # ─── features/dashboard ───────────────────────────────────────────────
        "src/features/dashboard/components/clinician/ClinicianDashboard.tsx": placeholder,
        "src/features/dashboard/components/clinician/StatsOverviewRow.tsx": placeholder,
        "src/features/dashboard/components/clinician/UrgentPatientsTable.tsx": placeholder,
        "src/features/dashboard/components/clinician/PendingRecsWidget.tsx": placeholder,
        "src/features/dashboard/components/clinician/RecentActivityFeed.tsx": placeholder,
        "src/features/dashboard/components/patient/PatientDashboard.tsx": placeholder,
        "src/features/dashboard/components/patient/WeightStatusCard.tsx": placeholder,
        "src/features/dashboard/components/patient/BPStatusCard.tsx": placeholder,
        "src/features/dashboard/components/patient/LabSummarySection.tsx": placeholder,
        "src/features/dashboard/components/patient/RiskScoreCard.tsx": placeholder,
        "src/features/dashboard/components/patient/TodayTasksWidget.tsx": placeholder,
        "src/features/dashboard/hooks/useClinicianDashboard.ts": placeholder,
        "src/features/dashboard/hooks/usePatientDashboard.ts": placeholder,
        "src/features/dashboard/index.ts": placeholder,

        # ─── features/admin ───────────────────────────────────────────────────
        "src/features/admin/components/UserManagementTable.tsx": placeholder,
        "src/features/admin/components/UserForm.tsx": placeholder,
        "src/features/admin/components/AuditLogTable.tsx": placeholder,
        "src/features/admin/components/SystemHealthWidget.tsx": placeholder,
        "src/features/admin/hooks/useAdmin.ts": placeholder,
        "src/features/admin/services/admin.service.ts": placeholder,
        "src/features/admin/types/admin.types.ts": placeholder,
        "src/features/admin/index.ts": placeholder,

        # ─── components/ui ────────────────────────────────────────────────────
        "src/components/ui/Button.tsx": placeholder,
        "src/components/ui/Input.tsx": placeholder,
        "src/components/ui/Select.tsx": placeholder,
        "src/components/ui/Textarea.tsx": placeholder,
        "src/components/ui/Checkbox.tsx": placeholder,
        "src/components/ui/Badge.tsx": placeholder,
        "src/components/ui/Card.tsx": placeholder,
        "src/components/ui/Modal.tsx": placeholder,
        "src/components/ui/Drawer.tsx": placeholder,
        "src/components/ui/Tooltip.tsx": placeholder,
        "src/components/ui/Skeleton.tsx": placeholder,
        "src/components/ui/Spinner.tsx": placeholder,
        "src/components/ui/Avatar.tsx": placeholder,
        "src/components/ui/Divider.tsx": placeholder,
        "src/components/ui/EmptyState.tsx": placeholder,
        "src/components/ui/Alert.tsx": placeholder,
        "src/components/ui/Toast.tsx": placeholder,
        "src/components/ui/Tabs.tsx": placeholder,
        "src/components/ui/Accordion.tsx": placeholder,
        "src/components/ui/ProgressBar.tsx": placeholder,
        "src/components/ui/DatePicker.tsx": placeholder,
        "src/components/ui/NumberInput.tsx": placeholder,
        "src/components/ui/index.ts": placeholder,

        # ─── components/layout ────────────────────────────────────────────────
        "src/components/layout/AppShell.tsx": placeholder,
        "src/components/layout/Sidebar.tsx": placeholder,
        "src/components/layout/Header.tsx": placeholder,
        "src/components/layout/SidebarNavItem.tsx": placeholder,
        "src/components/layout/MobileNav.tsx": placeholder,
        "src/components/layout/PageHeader.tsx": placeholder,
        "src/components/layout/ContentArea.tsx": placeholder,

        # ─── components/charts ────────────────────────────────────────────────
        "src/components/charts/LineChart.tsx": placeholder,
        "src/components/charts/AreaChart.tsx": placeholder,
        "src/components/charts/BarChart.tsx": placeholder,
        "src/components/charts/GaugeChart.tsx": placeholder,
        "src/components/charts/SparklineChart.tsx": placeholder,
        "src/components/charts/ChartWrapper.tsx": placeholder,

        # ─── components/data-display ──────────────────────────────────────────
        "src/components/data-display/StatCard.tsx": placeholder,
        "src/components/data-display/TrendIndicator.tsx": placeholder,
        "src/components/data-display/ValueWithUnit.tsx": placeholder,
        "src/components/data-display/RangeIndicator.tsx": placeholder,
        "src/components/data-display/StatusDot.tsx": placeholder,
        "src/components/data-display/MetricCard.tsx": placeholder,

        # ─── components/feedback ──────────────────────────────────────────────
        "src/components/feedback/ErrorBoundary.tsx": placeholder,
        "src/components/feedback/LoadingOverlay.tsx": placeholder,
        "src/components/feedback/PageLoader.tsx": placeholder,
        "src/components/feedback/ConfirmDialog.tsx": placeholder,

        # ─── lib ──────────────────────────────────────────────────────────────
        "src/lib/api/client.ts": placeholder,
        "src/lib/api/interceptors.ts": placeholder,
        "src/lib/api/endpoints.ts": placeholder,
        "src/lib/query/queryClient.ts": placeholder,
        "src/lib/store/index.ts": placeholder,
        "src/lib/utils/date.utils.ts": placeholder,
        "src/lib/utils/format.utils.ts": placeholder,
        "src/lib/utils/validation.utils.ts": placeholder,
        "src/lib/utils/medical.utils.ts": placeholder,
        "src/lib/utils/cn.ts": placeholder,

        # ─── hooks ────────────────────────────────────────────────────────────
        "src/hooks/useDebounce.ts": placeholder,
        "src/hooks/useLocalStorage.ts": placeholder,
        "src/hooks/usePagination.ts": placeholder,
        "src/hooks/usePermission.ts": placeholder,
        "src/hooks/useToast.ts": placeholder,
        "src/hooks/useMediaQuery.ts": placeholder,

        # ─── providers ────────────────────────────────────────────────────────
        "src/providers/QueryProvider.tsx": placeholder,
        "src/providers/AuthProvider.tsx": placeholder,
        "src/providers/ToastProvider.tsx": placeholder,

        # ─── styles ───────────────────────────────────────────────────────────
        "src/styles/globals.css": css_placeholder,
        "src/styles/fonts.css": css_placeholder,

        # ─── types ────────────────────────────────────────────────────────────
        "src/types/api.types.ts": placeholder,
        "src/types/common.types.ts": placeholder,
        "src/types/next-auth.d.ts": placeholder,

        # ─── config ───────────────────────────────────────────────────────────
        "src/config/navigation.ts": placeholder,
        "src/config/permissions.ts": placeholder,
        "src/config/constants.ts": placeholder,

        # ─── root config files ────────────────────────────────────────────────
        ".env.local": (
            "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n"
            "NEXT_PUBLIC_APP_NAME=سامانه دیالیز\n"
            "NEXT_PUBLIC_APP_VERSION=1.0.0\n"
        ),
        ".env.example": (
            "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n"
            "NEXT_PUBLIC_APP_NAME=سامانه دیالیز\n"
            "NEXT_PUBLIC_APP_VERSION=1.0.0\n"
        ),
        ".eslintrc.json": (
            '{\n'
            '  "extends": ["next/core-web-vitals", "next/typescript"],\n'
            '  "rules": {\n'
            '    "@typescript-eslint/no-unused-vars": "warn",\n'
            '    "@typescript-eslint/no-explicit-any": "warn"\n'
            '  }\n'
            '}\n'
        ),
        ".prettierrc": (
            '{\n'
            '  "semi": false,\n'
            '  "singleQuote": true,\n'
            '  "tabWidth": 2,\n'
            '  "trailingComma": "es5",\n'
            '  "printWidth": 100,\n'
            '  "plugins": ["prettier-plugin-tailwindcss"]\n'
            '}\n'
        ),
        ".gitignore": (
            "node_modules/\n.next/\nout/\ndist/\n"
            ".env.local\n.env.*.local\n"
            "*.log\n.DS_Store\n"
            "coverage/\n.turbo/\n"
        ),
        "next.config.ts": placeholder,
        "tailwind.config.ts": placeholder,
        "tsconfig.json": (
            '{\n'
            '  "compilerOptions": {\n'
            '    "target": "ES2017",\n'
            '    "lib": ["dom", "dom.iterable", "esnext"],\n'
            '    "allowJs": true,\n'
            '    "skipLibCheck": true,\n'
            '    "strict": true,\n'
            '    "noEmit": true,\n'
            '    "esModuleInterop": true,\n'
            '    "module": "esnext",\n'
            '    "moduleResolution": "bundler",\n'
            '    "resolveJsonModule": true,\n'
            '    "isolatedModules": true,\n'
            '    "jsx": "preserve",\n'
            '    "incremental": true,\n'
            '    "plugins": [{"name": "next"}],\n'
            '    "paths": {\n'
            '      "@/*": ["./src/*"],\n'
            '      "@features/*": ["./src/features/*"],\n'
            '      "@components/*": ["./src/components/*"],\n'
            '      "@lib/*": ["./src/lib/*"],\n'
            '      "@hooks/*": ["./src/hooks/*"],\n'
            '      "@types/*": ["./src/types/*"],\n'
            '      "@providers/*": ["./src/providers/*"],\n'
            '      "@config/*": ["./src/config/*"]\n'
            '    }\n'
            '  },\n'
            '  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],\n'
            '  "exclude": ["node_modules"]\n'
            '}\n'
        ),
        "postcss.config.js": (
            'module.exports = {\n'
            '  plugins: {\n'
            '    tailwindcss: {},\n'
            '    autoprefixer: {},\n'
            '  },\n'
            '}\n'
        ),
        "package.json": (
            '{\n'
            '  "name": "hemodialysis-frontend",\n'
            '  "version": "1.0.0",\n'
            '  "private": true,\n'
            '  "scripts": {\n'
            '    "dev": "next dev",\n'
            '    "build": "next build",\n'
            '    "start": "next start",\n'
            '    "lint": "next lint",\n'
            '    "format": "prettier --write \\"src/**/*.{ts,tsx,css}\\"",\n'
            '    "type-check": "tsc --noEmit"\n'
            '  },\n'
            '  "dependencies": {\n'
            '    "next": "^15.0.0",\n'
            '    "react": "^19.0.0",\n'
            '    "react-dom": "^19.0.0",\n'
            '    "@tanstack/react-query": "^5.0.0",\n'
            '    "@tanstack/react-query-devtools": "^5.0.0",\n'
            '    "@tanstack/react-table": "^8.0.0",\n'
            '    "zustand": "^4.0.0",\n'
            '    "axios": "^1.6.0",\n'
            '    "react-hook-form": "^7.0.0",\n'
            '    "@hookform/resolvers": "^3.0.0",\n'
            '    "zod": "^3.0.0",\n'
            '    "recharts": "^2.0.0",\n'
            '    "date-fns": "^3.0.0",\n'
            '    "date-fns-jalali": "^3.0.0",\n'
            '    "lucide-react": "^0.400.0",\n'
            '    "class-variance-authority": "^0.7.0",\n'
            '    "clsx": "^2.0.0",\n'
            '    "tailwind-merge": "^2.0.0",\n'
            '    "framer-motion": "^11.0.0",\n'
            '    "react-hot-toast": "^2.0.0",\n'
            '    "js-cookie": "^3.0.0"\n'
            '  },\n'
            '  "devDependencies": {\n'
            '    "typescript": "^5.0.0",\n'
            '    "@types/node": "^20.0.0",\n'
            '    "@types/react": "^19.0.0",\n'
            '    "@types/react-dom": "^19.0.0",\n'
            '    "@types/js-cookie": "^3.0.0",\n'
            '    "tailwindcss": "^3.4.0",\n'
            '    "autoprefixer": "^10.0.0",\n'
            '    "postcss": "^8.0.0",\n'
            '    "@tailwindcss/forms": "^0.5.0",\n'
            '    "@tailwindcss/typography": "^0.5.0",\n'
            '    "prettier": "^3.0.0",\n'
            '    "prettier-plugin-tailwindcss": "^0.6.0",\n'
            '    "eslint": "^8.0.0",\n'
            '    "eslint-config-next": "^15.0.0"\n'
            '  }\n'
            '}\n'
        ),
        "Dockerfile": (
            "FROM node:20-alpine AS deps\n"
            "WORKDIR /app\n"
            "COPY package.json package-lock.json ./\n"
            "RUN npm ci --only=production\n\n"
            "FROM node:20-alpine AS builder\n"
            "WORKDIR /app\n"
            "COPY --from=deps /app/node_modules ./node_modules\n"
            "COPY . .\n"
            "RUN npm run build\n\n"
            "FROM node:20-alpine AS runner\n"
            "WORKDIR /app\n"
            "ENV NODE_ENV=production\n"
            "COPY --from=builder /app/.next/standalone ./\n"
            "COPY --from=builder /app/.next/static ./.next/static\n"
            "COPY --from=builder /app/public ./public\n"
            "EXPOSE 3000\n"
            'CMD ["node", "server.js"]\n'
        ),
        "docker-compose.yml": (
            "version: '3.8'\n"
            "services:\n"
            "  frontend:\n"
            "    build: .\n"
            "    ports:\n"
            "      - '3000:3000'\n"
            "    environment:\n"
            "      - NEXT_PUBLIC_API_URL=${API_URL}\n"
            "      - NODE_ENV=production\n"
            "    restart: unless-stopped\n"
        ),
        "README.md": (
            "# سامانه پایش دیالیز — فرانت‌اند\n\n"
            "## راه‌اندازی\n\n"
            "```bash\n"
            "npm install\n"
            "npm run dev\n"
            "```\n\n"
            "## ساختار پروژه\n\n"
            "پروژه بر اساس معماری Feature-based سازمان‌دهی شده است.\n\n"
            "## دستورات\n\n"
            "- `npm run dev` — سرور توسعه\n"
            "- `npm run build` — ساخت نسخه تولید\n"
            "- `npm run lint` — بررسی کد\n"
            "- `npm run format` — فرمت‌بندی کد\n"
            "- `npm run type-check` — بررسی تایپ‌ها\n"
        ),
    }

    total = len(structure)
    created = 0

    print(f"\n{'='*60}")
    print(f"  ایجاد ساختار پروژه فرانت‌اند سامانه همودیالیز")
    print(f"{'='*60}\n")

    for relative_path, content in structure.items():
        file_path = base_path / relative_path
        create_file(file_path, content)
        created += 1
        print(f"  ✅  {relative_path}")

    print(f"\n{'='*60}")
    print(f"  تعداد فایل‌های ایجادشده: {created} از {total}")
    print(f"  مسیر پروژه: {base_path.resolve()}")
    print(f"{'='*60}\n")
    print("  مراحل بعدی:")
    print("  1. cd", base_path.name)
    print("  2. npm install")
    print("  3. npm run dev")
    print()


def main() -> None:
    if len(sys.argv) > 1:
        project_name = sys.argv[1]
    else:
        project_name = "hemodialysis-frontend"

    base_path = Path(project_name)

    if base_path.exists():
        answer = input(
            f"\n⚠️  پوشه '{project_name}' از قبل وجود دارد. ادامه می‌دهید؟ (y/n): "
        )
        if answer.lower() != "y":
            print("عملیات لغو شد.")
            sys.exit(0)

    create_structure(base_path)


if __name__ == "__main__":
    main()