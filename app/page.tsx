import { Hero } from '@/components/home/Hero'
import { Features } from '@/components/home/Features'
import { WhyIndia } from '@/components/home/WhyIndia'
import { HowItWorks } from '@/components/home/HowItWorks'
import { WhyClaudeOnly } from '@/components/home/WhyClaudeOnly'
import { FeaturedTools } from '@/components/home/FeaturedTools'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <WhyIndia />
      <HowItWorks />
      <WhyClaudeOnly />
      <FeaturedTools />
    </>
  )
}
