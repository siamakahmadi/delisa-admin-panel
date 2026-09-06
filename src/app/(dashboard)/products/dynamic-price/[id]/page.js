import { PricingRuleForm } from "@/components/pricing/pricing-rule-form";

export default async function PricingRuleEditorPage({ params }) {
  const { id } = await params;
  return <PricingRuleForm ruleId={id} />;
}
