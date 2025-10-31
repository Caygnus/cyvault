import { Plus } from 'lucide-react';
import Button, { ButtonProps } from './Button';
import { cn } from '@/lib/utils';

interface AddButtonProps extends Omit<ButtonProps, 'prefixIcon'> {
	/**
	 * Custom label text. Defaults to "Add"
	 */
	label?: string;
}

const AddButton = ({ label = 'Add', className, children, ...props }: AddButtonProps) => {
	return (
		<Button prefixIcon={<Plus />} className={cn('gap-1', className)} {...props}>
			{children || label}
		</Button>
	);
};

export default AddButton;
