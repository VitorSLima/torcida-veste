import { Star } from 'lucide-react';

// Decorativo: o projeto não tem avaliações reais (spec: estrelas só do layout).
export function RatingStars() {
    return (
        <p aria-hidden className="flex items-center gap-1 text-sm text-muted-foreground">
            {[0, 1, 2, 3, 4].map((index) => (
                <Star
                    key={index}
                    className={index < 4 ? 'size-4 fill-primary text-primary' : 'size-4 text-primary'}
                />
            ))}
            <span className="ml-1">(25 avaliações)</span>
        </p>
    );
}
