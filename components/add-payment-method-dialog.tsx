"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface AddPaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCard?: (cardData: { brand: string; last4: string; expiry: string }) => void
}

export function AddPaymentMethodDialog({ open, onOpenChange, onAddCard }: AddPaymentMethodDialogProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [zipCode, setZipCode] = useState("")

  const handleAddCard = () => {
    // Extract last 4 digits and determine brand from card number
    const last4 = cardNumber.slice(-4)
    const firstDigit = cardNumber.charAt(0)
    let brand = "Card"

    if (firstDigit === "4") brand = "Visa"
    else if (firstDigit === "5") brand = "Mastercard"
    else if (firstDigit === "3") brand = "Amex"
    else if (firstDigit === "6") brand = "Discover"

    onAddCard?.({ brand, last4, expiry })

    // Reset form and close
    setCardNumber("")
    setExpiry("")
    setCvc("")
    setCardName("")
    setZipCode("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              placeholder="John Smith"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Billing ZIP Code</Label>
            <Input id="zipCode" placeholder="12345" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCard}>Add Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
