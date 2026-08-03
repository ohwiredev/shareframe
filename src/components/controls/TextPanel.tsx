import type { BadgeState, PriceState, RatingState, TextStyle } from "../../state/types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ColorField } from "./ColorField";
import { PanelHeader } from "./PanelHeader";
import { RangeField } from "./RangeField";
import { TextEditor } from "./TextEditor";

type TextPanelProps = {
  title: TextStyle;
  description: TextStyle;
  badge?: BadgeState;
  price?: PriceState;
  originalPrice?: PriceState;
  rating?: RatingState;
  onTitleChange: (title: TextStyle) => void;
  onDescriptionChange: (description: TextStyle) => void;
  onBadgeChange: (badge: BadgeState | undefined) => void;
  onPriceChange: (price: PriceState | undefined) => void;
  onOriginalPriceChange: (originalPrice: PriceState | undefined) => void;
  onRatingChange: (rating: RatingState | undefined) => void;
};

export function TextPanel({
  title,
  description,
  badge,
  price,
  originalPrice,
  rating,
  onTitleChange,
  onDescriptionChange,
  onBadgeChange,
  onPriceChange,
  onOriginalPriceChange,
  onRatingChange,
}: TextPanelProps) {
  const hasEcommerceFields = badge || price || originalPrice || rating;

  return (
    <>
      <PanelHeader
        title="Text"
        subtitle="Edit title and description with independent type controls."
      />
      <TextEditor label="Title" style={title} onChange={onTitleChange} />
      <TextEditor
        label="Description"
        style={description}
        multiline
        onChange={onDescriptionChange}
      />

      {hasEcommerceFields && (
        <>
          <Separator className="section-rule" />
          <PanelHeader
            title="Product Details"
            subtitle="E-commerce fields for badges, pricing, and ratings."
          />

          {badge && (
            <section className="studio-section">
              <h2>Badge</h2>
              <div className="studio-field">
                <Label>Badge text</Label>
                <Input
                  value={badge.text}
                  placeholder="BESTSELLER"
                  onChange={(e) => onBadgeChange({ ...badge, text: e.currentTarget.value })}
                />
              </div>
              <ColorField
                label="Badge color"
                value={badge.color}
                onChange={(color) => onBadgeChange({ ...badge, color })}
              />
              <ColorField
                label="Badge background"
                value={badge.background}
                onChange={(background) => onBadgeChange({ ...badge, background })}
              />
            </section>
          )}

          {price && (
            <section className="studio-section">
              <h2>Price</h2>
              <div className="studio-field">
                <Label>Price</Label>
                <Input
                  value={price.text}
                  placeholder="$199"
                  onChange={(e) => onPriceChange({ ...price, text: e.currentTarget.value })}
                />
              </div>
              <RangeField
                label="Size"
                value={price.fontSize ?? 36}
                min={16}
                max={72}
                step={1}
                display={`${price.fontSize ?? 36}px`}
                onChange={(fontSize) => onPriceChange({ ...price, fontSize })}
              />
              <ColorField
                label="Price color"
                value={price.color}
                onChange={(color) => onPriceChange({ ...price, color })}
              />
            </section>
          )}

          {originalPrice && (
            <section className="studio-section">
              <h2>Original Price</h2>
              <div className="studio-field">
                <Label>Original price</Label>
                <Input
                  value={originalPrice.text}
                  placeholder="$299"
                  onChange={(e) =>
                    onOriginalPriceChange({
                      ...originalPrice,
                      text: e.currentTarget.value,
                    })
                  }
                />
              </div>
              <ColorField
                label="Strikethrough color"
                value={originalPrice.color}
                onChange={(color) => onOriginalPriceChange({ ...originalPrice, color })}
              />
            </section>
          )}

          {rating && (
            <section className="studio-section">
              <h2>Rating</h2>
              <RangeField
                label="Stars"
                value={rating.value}
                min={0}
                max={5}
                step={0.5}
                display={`${rating.value.toFixed(1)} / 5`}
                onChange={(value) => onRatingChange({ ...rating, value })}
              />
              <div className="studio-field">
                <Label>Review count</Label>
                <Input
                  value={rating.reviewCount}
                  placeholder="256 reviews"
                  onChange={(e) =>
                    onRatingChange({
                      ...rating,
                      reviewCount: e.currentTarget.value,
                    })
                  }
                />
              </div>
              <ColorField
                label="Star color"
                value={rating.color}
                onChange={(color) => onRatingChange({ ...rating, color })}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
