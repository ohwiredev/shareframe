import { Section } from "@astryxdesign/core/Section";
import { VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

type ControlSectionProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

/**
 * Labeled group inside the controls inspector.
 * Use for Background, Logo, Title, Description, Export, etc.
 */
export function ControlSection({
  title,
  description,
  children,
}: ControlSectionProps) {
  return (
    <Section
      variant="transparent"
      padding={4}
      dividers={["bottom"]}
      className="control-section"
    >
      <VStack gap={3}>
        <VStack gap={1}>
          <Heading level={4}>{title}</Heading>
          {description ? (
            <Text type="supporting" color="secondary">
              {description}
            </Text>
          ) : null}
        </VStack>
        {children}
      </VStack>
    </Section>
  );
}
