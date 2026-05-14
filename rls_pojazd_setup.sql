-- Enable Row Level Security on POJAZD table
ALTER TABLE public."POJAZD" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow users to view vehicles from their company" ON public."POJAZD";
DROP POLICY IF EXISTS "Allow managers to insert vehicles" ON public."POJAZD";
DROP POLICY IF EXISTS "Allow managers to update vehicles" ON public."POJAZD";
DROP POLICY IF EXISTS "Allow managers to delete vehicles" ON public."POJAZD";

-- Policy 1: SELECT - Users can view vehicles from their company
CREATE POLICY "Allow users to view vehicles from their company"
ON public."POJAZD"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."UZYTKOWNIK" u
    WHERE u.id = auth.uid()
    AND u.firma_id = "POJAZD".firma_id
  )
);

-- Policy 2: INSERT - Only Właściciel (Owner) and Administrator roles can insert
CREATE POLICY "Allow managers to insert vehicles"
ON public."POJAZD"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."UZYTKOWNIK" u
    WHERE u.id = auth.uid()
    AND u.firma_id = "POJAZD".firma_id
    AND u.rola IN ('Właściciel', 'Administrator')
  )
);

-- Policy 3: UPDATE - Only Właściciel and Administrator can update
CREATE POLICY "Allow managers to update vehicles"
ON public."POJAZD"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."UZYTKOWNIK" u
    WHERE u.id = auth.uid()
    AND u.firma_id = "POJAZD".firma_id
    AND u.rola IN ('Właściciel', 'Administrator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."UZYTKOWNIK" u
    WHERE u.id = auth.uid()
    AND u.firma_id = "POJAZD".firma_id
    AND u.rola IN ('Właściciel', 'Administrator')
  )
);

-- Policy 4: DELETE - Only Właściciel and Administrator can delete
CREATE POLICY "Allow managers to delete vehicles"
ON public."POJAZD"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."UZYTKOWNIK" u
    WHERE u.id = auth.uid()
    AND u.firma_id = "POJAZD".firma_id
    AND u.rola IN ('Właściciel', 'Administrator')
  )
);
