import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";

export interface Faq {
  question: string;
  answer: string;
}

interface FaqManagerProps {
  faqs: Faq[];
  onChange: (faqs: Faq[]) => void;
}

export function FaqManager({ faqs, onChange }: FaqManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Faq>({ question: "", answer: "" });

  const handleAdd = () => {
    setFormData({ question: "", answer: "" });
    setEditIndex(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData({ ...faqs[index] });
    setEditIndex(index);
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    if (editIndex !== null) {
      // Update existing
      const updated = [...faqs];
      updated[editIndex] = formData;
      onChange(updated);
    } else {
      // Add new
      onChange([...faqs, formData]);
    }
    setIsAddDialogOpen(false);
    setFormData({ question: "", answer: "" });
    setEditIndex(null);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    const updated = faqs.filter((_, i) => i !== deleteIndex);
    onChange(updated);
    setDeleteIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5" />
          Frequently Asked Questions ({faqs.length})
        </Label>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            No FAQs added yet. Add common questions and answers to help your AI agents respond accurately.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <Card key={index} className="group">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{faq.question}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(index)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteIndex(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            <DialogDescription>
              Add a question and answer that your AI agents can use to respond to customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question</Label>
              <Input
                id="faq-question"
                placeholder="e.g., What are your business hours?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea
                id="faq-answer"
                placeholder="e.g., We're open Monday through Friday, 8am to 5pm..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.question.trim() || !formData.answer.trim()}
            >
              {editIndex !== null ? "Save Changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the FAQ from your business profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
