package com.brse.trainer;
import java.util.List;
import static com.brse.trainer.DictionaryContracts.*;
public interface DictionaryProvider {
 boolean enabled();
 List<Entry> lookup(String query);
}
