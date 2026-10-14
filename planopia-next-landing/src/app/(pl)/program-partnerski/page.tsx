import BlogHeader from '@/components/BlogHeader'
import PartnerProgramLanding from '@/components/partnerProgram/PartnerProgramLanding'
import { PARTNER_PAGE_PATH } from '@/data/partnerProgramCopy'

export default function ProgramPartnerskiPage() {
	return (
		<>
			<BlogHeader lang="pl" plUrl={PARTNER_PAGE_PATH} hideLanguageSwitcher />
			<PartnerProgramLanding />
		</>
	)
}
