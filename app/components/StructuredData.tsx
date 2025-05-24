interface StructuredDataProps {
  type: "website" | "card" | "deck" | "organization";
  data: Record<string, unknown>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const generateStructuredData = () => {
    switch (type) {
      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Algomancer.cc",
          description: "Ultimate Algomancy deck builder and card database",
          url: "https://algomancer.cc",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://algomancer.cc/cards?search={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
          sameAs: ["https://algomancer.cc"],
        };

      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Algomancer.cc",
          description:
            "The ultimate platform for Algomancy deck building and card database",
          url: "https://algomancer.cc",
          logo: "https://algomancer.cc/logo.png",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            url: "https://algomancer.cc",
          },
        };

      case "card":
        return {
          "@context": "https://schema.org",
          "@type": "Thing",
          name: data.name,
          description: `${data.name} - Algomancy card with ${data.total_cost} mana cost`,
          image: data.image_url,
          url: `https://algomancer.cc/cards/${data._id}`,
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Element",
              value: data.element,
            },
            {
              "@type": "PropertyValue",
              name: "Type",
              value: data.type,
            },
            {
              "@type": "PropertyValue",
              name: "Mana Cost",
              value: data.total_cost,
            },
          ],
        };

      case "deck":
        return {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: data.name,
          description: `Algomancy deck: ${data.name} by ${data.creator_name}`,
          creator: {
            "@type": "Person",
            name: data.creator_name,
          },
          dateCreated: data.created_at,
          url: `https://algomancer.cc/decks/${data._id}`,
          genre: "Card Game Deck",
          about: "Algomancy",
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Card Count",
              value: data.cards?.length || 0,
            },
            {
              "@type": "PropertyValue",
              name: "Likes",
              value: data.likes || 0,
            },
          ],
        };

      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
